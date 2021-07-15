declare module '@alifd/fusion-collector' {
  function collectDetail(options: {
    rootDir: string;
    basicPackage?: string | string[];
    kit?: string;
    kitVersion?: string;
    cmdType?: string;
  }): void;
  export { collectDetail };
}
