import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { SCOPE_STATEMENT_PLAIN } from "../../src/lib/scope";
import { encodeSource } from "../../src/lib/share";

/**
 * The portal is driven the way a reader uses it: through the rendered page, in a
 * real browser, against the production build (or, when `E2E_BASE_URL` is set,
 * against the deployed site — the same suite runs on both).
 */

const EXPECTED_VERSION = readFileSync(
  resolve(process.cwd(), "SOROBAN_LINT_VERSION"),
  "utf8",
).trim().replace(/^v/, "");

/** Wait until the WASM module has been instantiated in the browser. */
async function waitForLinter(page: Page) {
  await expect(page.getByTestId("workbench")).toHaveAttribute("data-status", "ready");
}

async function findingRules(page: Page): Promise<string[]> {
  return page.getByTestId("finding").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-rule") ?? ""),
  );
}

async function findingsWithLines(page: Page): Promise<{ rule: string; line: number }[]> {
  return page.getByTestId("finding").evaluateAll((nodes) =>
    nodes.map((node) => ({
      rule: node.getAttribute("data-rule") ?? "",
      line: Number(node.getAttribute("data-line") ?? "0"),
    })),
  );
}

/**
 * Replace the editor contents with `source`.
 *
 * `insertText` inserts the text as one input event, the way a paste arrives, so
 * Monaco's auto-closing and auto-indent (which react to individual key presses)
 * cannot rewrite the contract and make the expected line numbers wrong.
 */
async function typeIntoEditor(page: Page, source: string) {
  const editor = page.locator(".monaco-editor").first();
  const view = page.locator(".monaco-editor .view-lines").first();
  await expect(editor).toBeVisible();
  // Monaco may still be wiring up its input when the WASM status flips to ready,
  // so retry the select-all-then-insert until the text is actually in the
  // buffer, using a line of the contract as the witness.
  await expect(async () => {
    await view.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText(source);
    await expect(view).toContainText('panic!("boom");');
  }).toPass({ timeout: 20_000 });
}

const TYPED_VULNERABLE = `#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct Typed;

#[contractimpl]
impl Typed {
    pub fn boom(env: Env) -> u32 {
        let _ = env;
        panic!("boom");
    }
}
`;

test("runs the real WASM linter in the browser", async ({ page }) => {
  await page.goto("/");
  await waitForLinter(page);

  // The version comes from the compiled-in Rust crate, so this proves the
  // module really instantiated rather than a stub rendering.
  await expect(page.getByTestId("wasm-status")).toContainText(`soroban-lint-wasm ${EXPECTED_VERSION}`);

  // The landing page carries the scope statement verbatim.
  await expect(page.getByTestId("scope-statement")).toHaveText(SCOPE_STATEMENT_PLAIN);

  // Opening sample: a missing authorization check. Default rules only, so SL005
  // (experimental) is not reported yet.
  await expect(page.getByTestId("finding")).toHaveCount(1);
  expect(await findingRules(page)).toEqual(["SL001"]);
  await expect(page.getByTestId("summary")).toContainText("1finding");

  // Switching samples re-runs the linter.
  await page.getByTestId("sample-clean").click();
  await expect(page.getByTestId("empty-state")).toBeVisible();
  await expect(page.getByTestId("finding")).toHaveCount(0);

  await page.getByTestId("sample-panic-hazard").click();
  await expect(page.getByTestId("finding")).toHaveCount(1);
  expect(await findingRules(page)).toEqual(["SL002"]);

  // The experimental toggle changes the rule set.
  await page.getByTestId("sample-missing-auth").click();
  await expect(page.getByTestId("finding")).toHaveCount(1);
  await page.getByTestId("experimental-toggle").check();
  await expect(page.getByTestId("finding")).toHaveCount(2);
  expect(await findingRules(page)).toEqual(["SL001", "SL005"]);

  // An explicit run is idempotent.
  await page.getByTestId("run-lint").click();
  await expect(page.getByTestId("finding")).toHaveCount(2);

  await page.getByTestId("experimental-toggle").uncheck();
  await expect(page.getByTestId("finding")).toHaveCount(1);
  expect(await findingRules(page)).toEqual(["SL001"]);
});

test("lints a contract typed into the editor, at the right line", async ({ page }) => {
  await page.goto("/");
  await waitForLinter(page);

  await typeIntoEditor(page, TYPED_VULNERABLE);

  // Linting is debounced, so poll for the finding that belongs to the *typed*
  // contract rather than the default sample it replaced.
  await expect.poll(() => findingsWithLines(page)).toEqual([{ rule: "SL002", line: 11 }]);

  // The findings panel and the editor markers are fed by the same run, but they
  // are set through different code paths — assert the markers landed on the
  // model too, so a broken `onMount` cannot leave the editor clean while the
  // panel shows a finding.
  await expect.poll(() => page.evaluate(() => {
    const monaco = (
      window as unknown as {
        monaco: {
          editor: {
            getModelMarkers: (filter: { owner: string }) => {
              code: string;
              startLineNumber: number;
            }[];
          };
        };
      }
    ).monaco;
    return monaco.editor
      .getModelMarkers({ owner: "soroban-lint" })
      .map((marker) => ({ rule: marker.code, line: marker.startLineNumber }));
  })).toEqual([{ rule: "SL002", line: 11 }]);
});

test("loads a snippet from a share link, and nothing is uploaded", async ({ page }) => {
  const shared = "#![no_std]\nuse soroban_sdk::{contract, contractimpl, Env};\n\n#[contract]\npub struct S;\n\n#[contractimpl]\nimpl S {\n    pub fn leak(env: Env, key: u32) -> u32 {\n        env.storage().instance().get(&key).unwrap()\n    }\n}\n";
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto(`/#source=${encodeSource(shared)}`);
  await waitForLinter(page);

  await expect(page.getByTestId("finding")).toHaveCount(1);
  expect(await findingRules(page)).toEqual(["SL002"]);
  await expect(page.getByTestId("sample-blurb")).toContainText("share link");

  // The only network traffic is the portal's own assets; the fragment is never
  // sent anywhere.
  expect(requests.every((url) => !url.includes("source="))).toBe(true);
});

test("catalogues the registered rules", async ({ page }) => {
  await page.goto("/");
  await waitForLinter(page);
  const catalog = page.getByTestId("rule-catalog");
  await catalog.locator("summary").click();
  await expect(catalog).toContainText("8 registered rules");
  await expect(catalog).toContainText("SL008");
});

test("a rule page documents its example and limitations", async ({ page }) => {
  await page.goto("/rules/SL001");
  await expect(page.getByRole("heading", { name: "SL001", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Limitations" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Flagged", exact: true })).toBeVisible();
});

for (const path of ["/", "/rules", "/rules/SL001", "/docs"]) {
  test(`has no automatically-detectable accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path === "/") {
      await waitForLinter(page);
    }
    // Monaco renders its own DOM and is excluded from the automated pass; the
    // portal's own markup is what this gate is responsible for.
    const results = await new AxeBuilder({ page }).exclude(".monaco-editor").analyze();
    expect(results.violations).toEqual([]);
  });
}
