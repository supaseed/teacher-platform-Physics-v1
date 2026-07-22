export type PrintQuizMode = "standard" | "large";

const PRINT_MODE_ATTR = "data-print-mode";

function forceStyleFlush(): void {
  // Ensure the browser applies data-print-mode styles before opening the dialog.
  void document.body.offsetHeight;
}

function printOnce(mode: PrintQuizMode): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("afterprint", onAfterPrint);
      window.clearTimeout(safetyTimer);
      document.body.removeAttribute(PRINT_MODE_ATTR);
      resolve();
    };

    const onAfterPrint = () => finish();

    document.body.setAttribute(PRINT_MODE_ATTR, mode);
    forceStyleFlush();

    window.addEventListener("afterprint", onAfterPrint);
    // Safety only — do not fire while the print dialog is likely still open.
    const safetyTimer = window.setTimeout(finish, 120_000);

    window.print();
  });
}

/** Opens the browser print dialog for standard quiz PDF, optionally followed by large print (18pt). */
export async function printQuizPdf(options: {
  includeLargePrint: boolean;
}): Promise<void> {
  await printOnce("standard");
  if (options.includeLargePrint) {
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    await printOnce("large");
  }
}
