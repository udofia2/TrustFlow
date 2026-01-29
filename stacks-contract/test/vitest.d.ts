/// <reference types="vitest/globals" />
/// <reference types="@stacks/clarinet-sdk/vitest-helpers" />

import { Simnet } from "@stacks/clarinet-sdk";

declare global {
  const simnet: Simnet;
}

