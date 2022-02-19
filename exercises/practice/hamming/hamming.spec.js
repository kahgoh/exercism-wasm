import { compileWat, WasmRunner } from "wasm-lib";

let wasmModule;
let currentInstance;

function compute(first, second) {
  const firstBufferOffset = 1024;
  const firstBufferLength = 1024;

  const firstLengthEncoded = new TextEncoder().encode(first).length;
  if (firstLengthEncoded > firstBufferLength) {
    throw new Error("String is too large for of size 128 bytes");
  }

  currentInstance.set_mem_as_utf8(firstBufferOffset, firstLengthEncoded, first);

  const secondBufferOffset = 2048;
  const secondBufferLength = 1024;

  const secondLengthEncoded = new TextEncoder().encode(second).length;
  if (secondLengthEncoded > secondBufferLength) {
    throw new Error("String is too large for of size 128 bytes");
  }

  currentInstance.set_mem_as_utf8(
    secondBufferOffset,
    secondLengthEncoded,
    second
  );

  return currentInstance.exports.compute(
    firstBufferOffset,
    firstLengthEncoded,
    secondBufferOffset,
    secondLengthEncoded
  );
}

beforeAll(async () => {
  try {
    const watPath = new URL("./hamming.wat", import.meta.url);
    const { buffer } = await compileWat(watPath);
    wasmModule = await WebAssembly.compile(buffer);
  } catch (err) {
    console.log(`Error compiling *.wat: ${err}`);
    process.exit(1);
  }
});

describe("Hamming", () => {
  beforeEach(async () => {
    currentInstance = null;
    if (!wasmModule) {
      return Promise.reject();
    }
    try {
      currentInstance = await new WasmRunner(wasmModule);
      return Promise.resolve();
    } catch (err) {
      console.log(`Error instantiating WebAssembly module: ${err}`);
      return Promise.reject();
    }
  });

  test("empty strands", () => {
    expect(compute("", "")).toEqual(0);
  });

  xtest("single letter identical strands", () => {
    expect(compute("A", "A")).toEqual(0);
  });

  xtest("single letter different strands", () => {
    expect(compute("G", "T")).toEqual(1);
  });

  xtest("long identical strands", () => {
    expect(compute("GGACTGAAATCTG", "GGACTGAAATCTG")).toEqual(0);
  });

  xtest("long different strands", () => {
    expect(compute("GGACGGATTCTG", "AGGACGGATTCT")).toEqual(9);
  });

  xtest("disallow first strand longer", () => {
    expect(compute("AATG", "AAA")).toEqual(-1);
  });

  xtest("disallow second strand longer", () => {
    expect(compute("ATA", "AGTG")).toEqual(-1);
  });

  xtest("disallow empty first strand", () => {
    expect(compute("", "G")).toEqual(-1);
  });

  xtest("disallow empty second strand", () => {
    expect(compute("G", "")).toEqual(-1);
  });
});
