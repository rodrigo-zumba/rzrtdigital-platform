import { describe, expect, it } from "vitest";

import {
  MissingOrganizationFilterError,
  assertOrganizationFilterPresent,
  withDefaultSoftDeleteFilter,
} from "@/lib/db/tenant-guard";

describe("assertOrganizationFilterPresent", () => {
  it("lança para modelo tenant-scoped sem organizationId no where", () => {
    expect(() => assertOrganizationFilterPresent("Project", "findMany", { where: { name: "x" } })).toThrow(
      MissingOrganizationFilterError,
    );
  });

  it("lança quando where está totalmente ausente", () => {
    expect(() => assertOrganizationFilterPresent("Ticket", "deleteMany", undefined)).toThrow(
      MissingOrganizationFilterError,
    );
  });

  it("permite quando organizationId está presente, mesmo com valor null (campo opcional)", () => {
    expect(() =>
      assertOrganizationFilterPresent("Notification", "findMany", { where: { organizationId: null } }),
    ).not.toThrow();
  });

  it("permite quando organizationId está presente com valor real", () => {
    expect(() =>
      assertOrganizationFilterPresent("Project", "findMany", { where: { organizationId: "org_1" } }),
    ).not.toThrow();
  });

  it("ignora modelos que não são tenant-scoped (ex.: User, Task)", () => {
    expect(() => assertOrganizationFilterPresent("User", "findMany", { where: {} })).not.toThrow();
    expect(() => assertOrganizationFilterPresent("Task", "findMany", { where: {} })).not.toThrow();
  });

  it("ignora operações sem where relevante (ex.: findUnique, create)", () => {
    expect(() => assertOrganizationFilterPresent("Project", "findUnique", { where: { id: "p1" } })).not.toThrow();
    expect(() => assertOrganizationFilterPresent("Project", "create", { data: {} })).not.toThrow();
  });
});

describe("withDefaultSoftDeleteFilter", () => {
  it("injeta deletedAt: null quando ausente em leitura de modelo com soft delete", () => {
    const result = withDefaultSoftDeleteFilter("Project", "findMany", { where: { organizationId: "o1" } });
    expect(result.where).toEqual({ organizationId: "o1", deletedAt: null });
  });

  it("não sobrescreve deletedAt quando o chamador já decidiu explicitamente", () => {
    const result = withDefaultSoftDeleteFilter("Project", "findMany", {
      where: { organizationId: "o1", deletedAt: { not: null } },
    });
    expect(result.where).toEqual({ organizationId: "o1", deletedAt: { not: null } });
  });

  it("não afeta modelos sem soft delete", () => {
    const args = { where: { organizationId: "o1" } };
    expect(withDefaultSoftDeleteFilter("Notification", "findMany", args)).toBe(args);
  });

  it("não afeta operações fora da lista de leitura em lote", () => {
    const args = { where: { organizationId: "o1" } };
    expect(withDefaultSoftDeleteFilter("Project", "update", args)).toBe(args);
  });
});
