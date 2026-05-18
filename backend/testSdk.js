async function test() {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    console.log(pdfjsLib.version);
    console.log('Success');
  } catch (e) {
    console.error('Error', e);
  }
}
test();
