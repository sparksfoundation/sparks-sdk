export abstract class CoreAgent {
  public async import(data: Record<string, any>): Promise<void> {
    return Promise.resolve();
  }
  
  public async export(): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}