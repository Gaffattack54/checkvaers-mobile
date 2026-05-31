import { describe, expect, it } from "vitest";
import {
  findMatches,
  findMatchesIndexed,
  indexByState,
  POTENTIAL_MATCH_LIMIT,
} from "../matcher";
import type { VaersRecord } from "../types";
import { MOCK_VAERS_RECORDS } from "../mock-data";

/**
 * Construct a local-midnight Date for the given Y-M-D.
 * Mirrors how the check form will convert <input type="date"> values:
 * we want "June 1" to stay "June 1" regardless of the test runner's TZ.
 */
function localDate(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

const baseRecord: VaersRecord = {
  vaersId: "9999999",
  state: "CA",
  sex: "F",
  ageYears: 40,
  vaxDate: "2022-06-01",
  vaxManu: "PFIZER\\BIONTECH",
  symptoms: ["Headache"],
  symptomText: "test",
  recvDate: "2022-06-03",
  numDays: 1,
};

let recCounter = 0;
function rec(overrides: Partial<VaersRecord> = {}): VaersRecord {
  recCounter += 1;
  return {
    ...baseRecord,
    ...overrides,
    vaersId: overrides.vaersId ?? `auto-${recCounter}`,
  };
}

describe("findMatches — exact bucket", () => {
  it("flags a record with identical state/sex/age and same-day vax date as exact", () => {
    const records = [rec()];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.exact).toHaveLength(1);
    expect(result.potential).toHaveLength(0);
    expect(result.none).toBe(false);
  });

  it("flags records with age within ±1 year as exact", () => {
    const records = [
      rec({ ageYears: 41 }),
      rec({ ageYears: 39 }),
      rec({ ageYears: 42 }), // outside exact, inside potential
    ];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.exact).toHaveLength(2);
    expect(result.potential).toHaveLength(1);
  });

  it("flags records with vax date within ±7 days as exact", () => {
    const records = [
      rec({ vaxDate: "2022-06-08" }), // +7 days from user → exact
      rec({ vaxDate: "2022-05-25" }), // -7 days from user → exact
      rec({ vaxDate: "2022-06-09" }), // +8 days → potential
    ];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.exact).toHaveLength(2);
    expect(result.potential).toHaveLength(1);
  });

  it("treats any of multiple user dose dates as a match for the date window", () => {
    const records = [rec({ vaxDate: "2023-09-15" })];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [
          localDate(2021, 4, 1), // far
          localDate(2022, 6, 1), // far
          localDate(2023, 9, 10), // 5 days → exact
        ],
      },
      records
    );
    expect(result.exact).toHaveLength(1);
  });
});

describe("findMatches — potential bucket", () => {
  it("flags state+sex match with age within ±5 yrs and date within ±30 days", () => {
    const records = [
      rec({ ageYears: 44, vaxDate: "2022-06-25" }), // age +4, date +24 → potential
    ];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.exact).toHaveLength(0);
    expect(result.potential).toHaveLength(1);
  });

  it("excludes records where state does not match", () => {
    const records = [rec({ state: "TX" })];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.none).toBe(true);
  });

  it("excludes records where sex does not match", () => {
    const records = [rec({ sex: "M" })];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.none).toBe(true);
  });

  it("excludes records where age delta exceeds 5 years", () => {
    const records = [rec({ ageYears: 46 })];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.none).toBe(true);
  });

  it("excludes records where date delta exceeds 30 days", () => {
    const records = [rec({ vaxDate: "2022-07-05" })]; // +34 days
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.none).toBe(true);
  });

  it("sorts potentials by combined age+date closeness", () => {
    const records = [
      rec({ vaersId: "far", ageYears: 44, vaxDate: "2022-07-01" }), // |4|+30=34
      rec({ vaersId: "mid", ageYears: 42, vaxDate: "2022-06-15" }), // |2|+14=16
      rec({ vaersId: "near", ageYears: 41, vaxDate: "2022-06-05" }), // |1|+4=5 → exact
      rec({ vaersId: "med2", ageYears: 43, vaxDate: "2022-06-10" }), // |3|+9=12
    ];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.exact.map((r) => r.vaersId)).toEqual(["near"]);
    // Closest non-exact first.
    expect(result.potential.map((r) => r.vaersId)).toEqual([
      "med2",
      "mid",
      "far",
    ]);
  });

  it(`caps potentials at ${POTENTIAL_MATCH_LIMIT}`, () => {
    const records = Array.from({ length: 30 }, (_, i) =>
      rec({
        vaersId: `r${i}`,
        ageYears: 42, // outside exact (+2), inside potential
        vaxDate: "2022-06-15", // +14 days → outside exact, inside potential
      })
    );
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.potential).toHaveLength(POTENTIAL_MATCH_LIMIT);
  });

  it("does not include exact-bucket records in potential", () => {
    const records = [rec()]; // identical match
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      records
    );
    expect(result.exact).toHaveLength(1);
    expect(result.potential).toHaveLength(0);
  });
});

describe("findMatches — no match", () => {
  it("returns none=true when records are empty", () => {
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      []
    );
    expect(result.exact).toHaveLength(0);
    expect(result.potential).toHaveLength(0);
    expect(result.none).toBe(true);
  });

  it("returns none=true when user has no dose dates", () => {
    const records = [rec()];
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 40,
        vaccineDates: [],
      },
      records
    );
    expect(result.none).toBe(true);
  });
});

describe("indexByState + findMatchesIndexed", () => {
  it("buckets records by 2-letter state", () => {
    const records = [
      rec({ vaersId: "a", state: "CA" }),
      rec({ vaersId: "b", state: "CA" }),
      rec({ vaersId: "c", state: "TX" }),
    ];
    const index = indexByState(records);
    expect(index.get("CA")?.map((r) => r.vaersId).sort()).toEqual(["a", "b"]);
    expect(index.get("TX")?.map((r) => r.vaersId)).toEqual(["c"]);
    expect(index.get("WY")).toBeUndefined();
  });

  it("produces identical results to findMatches for any input", () => {
    const input = {
      state: "CA",
      sex: "F" as const,
      ageYears: 40,
      vaccineDates: [localDate(2022, 6, 1)],
    };
    const records = [
      rec({ vaersId: "1", state: "CA", ageYears: 40, vaxDate: "2022-06-01" }),
      rec({ vaersId: "2", state: "CA", ageYears: 42, vaxDate: "2022-06-15" }),
      rec({ vaersId: "3", state: "TX", ageYears: 40, vaxDate: "2022-06-01" }),
      rec({ vaersId: "4", state: "CA", ageYears: 40, sex: "M", vaxDate: "2022-06-01" }),
    ];
    const direct = findMatches(input, records);
    const indexed = findMatchesIndexed(input, indexByState(records));
    expect(indexed.exact.map((r) => r.vaersId)).toEqual(
      direct.exact.map((r) => r.vaersId)
    );
    expect(indexed.potential.map((r) => r.vaersId)).toEqual(
      direct.potential.map((r) => r.vaersId)
    );
    expect(indexed.none).toBe(direct.none);
  });

  it("returns none when the user's state has no records", () => {
    const records = [rec({ state: "CA" })];
    const result = findMatchesIndexed(
      {
        state: "WY",
        sex: "F",
        ageYears: 40,
        vaccineDates: [localDate(2022, 6, 1)],
      },
      indexByState(records)
    );
    expect(result.none).toBe(true);
  });

  it("returns the same Cluster A matches as the non-indexed version on the mock dataset", () => {
    const input = {
      state: "CA",
      sex: "F" as const,
      ageYears: 45,
      vaccineDates: [localDate(2021, 3, 11)],
    };
    const direct = findMatches(input, MOCK_VAERS_RECORDS);
    const indexed = findMatchesIndexed(
      input,
      indexByState(MOCK_VAERS_RECORDS)
    );
    expect(indexed.exact.map((r) => r.vaersId).sort()).toEqual(
      direct.exact.map((r) => r.vaersId).sort()
    );
  });
});

describe("findMatches — against mock dataset", () => {
  it("classifies all three Cluster A records as exact for a CA/F/45 user vaccinated March 11, 2021", () => {
    const result = findMatches(
      {
        state: "CA",
        sex: "F",
        ageYears: 45,
        vaccineDates: [localDate(2021, 3, 11)],
      },
      MOCK_VAERS_RECORDS
    );
    // 1000001 (F/45/2021-03-10), 1000002 (F/45/2021-03-12),
    // 1000003 (F/46/2021-03-15) are all within ±1 yr and ±7 days.
    const exactIds = result.exact.map((r) => r.vaersId).sort();
    expect(exactIds).toEqual(["1000001", "1000002", "1000003"]);
  });

  it("returns no matches for an obscure input not in the dataset", () => {
    const result = findMatches(
      {
        state: "WY",
        sex: "M",
        ageYears: 95,
        vaccineDates: [localDate(2020, 1, 1)],
      },
      MOCK_VAERS_RECORDS
    );
    expect(result.none).toBe(true);
  });
});
