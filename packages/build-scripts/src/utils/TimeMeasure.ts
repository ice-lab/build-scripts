import { IPlugin, IPluginAPI, IPluginOptions, IOnHookCallback } from '../core/Context';
import { tagBg, textWithColor, humanTime } from './output';

interface IMeasure {
  start?: number;
  end?: number;
  name?: string;
}

interface IMeasureData {
  [key: string]: IMeasure;
}

interface IHooksTimeMeasure {
  [key: string]: IMeasure[];
}

const getCurTime = (): number => new Date().getTime();
const getOutputTime = (start: number, end: number): string => {
  return textWithColor(humanTime(start, end), end - start);
};
class TimeMeasure {
  private startTime: number;

  private pluginTimeMeasure: IMeasureData;

  private hooksTimeMeasure: IHooksTimeMeasure;

  private firstPluginExcuteTime: number;

  private timeEvent: IMeasureData;

  constructor() {
    this.startTime = getCurTime();
    this.hooksTimeMeasure = {};
    this.pluginTimeMeasure = {};
    this.firstPluginExcuteTime = 0;
    this.timeEvent = {};
  }

  public wrapPlugin(plugin: IPlugin, name: string): IPlugin {
    if (!name) return plugin;
    this.pluginTimeMeasure[name] = {};
    return async (api: IPluginAPI, options?: IPluginOptions) => {
      const curTime = getCurTime();
      this.pluginTimeMeasure[name].start = curTime;
      if (!this.firstPluginExcuteTime) {
        this.firstPluginExcuteTime = curTime;
      }
      await plugin(api, options);
      this.pluginTimeMeasure[name].end = getCurTime();
    };
  }

  public wrapHook(hookFn: IOnHookCallback, hookName: string, name: string): IOnHookCallback {
    if (!name) return hookFn;
    this.hooksTimeMeasure[name] = [];
    return async (opts = {}) => {
      const hooksTime: IMeasure = {
        name: hookName,
      };
      hooksTime.start = getCurTime();
      await hookFn(opts);
      hooksTime.end = getCurTime();
      this.hooksTimeMeasure[name].push(hooksTime);
    };
  }

  public wrapEvent(eventFn: Function, eventName: string): Function {
    return async (...args: any) => {
      this.addTimeEvent(eventName, 'start');
      eventFn(...args);
      this.addTimeEvent(eventName, 'end');
    };
  }

  public getTimeMeasure() {
    return {
      start: this.startTime,
      firstPlugin: this.firstPluginExcuteTime,
      plugins: this.pluginTimeMeasure,
      hooks: this.hooksTimeMeasure,
      timeEvent: this.timeEvent,
    };
  }

  public addTimeEvent(event: string, eventType: 'start' | 'end'): void {
    if (!this.timeEvent[event]) {
      this.timeEvent[event] = {};
    }
    this.timeEvent[event][eventType] = getCurTime();
  }

  public getOutput(): string {
    const curTime = getCurTime();
    let output = `\n\n${tagBg('[Speed Measure]')} ⏱  \n`;

    // start time
    output += `General start time took ${getOutputTime(this.startTime, curTime)}\n`;

    // resolve time before run plugin
    output += `Resolve plugins time took ${getOutputTime(this.startTime, this.firstPluginExcuteTime)}\n`;

    // plugin time
    Object.keys(this.pluginTimeMeasure).forEach((pluginName) => {
      const pluginTime = this.pluginTimeMeasure[pluginName];
      output += `  Plugin ${pluginName} execution time took ${getOutputTime(pluginTime.start, pluginTime.end)}\n`;
    });

    // hooks time
    Object.keys(this.hooksTimeMeasure).forEach((pluginName) => {
      const hooksTime = this.hooksTimeMeasure[pluginName];
      output += `  Hooks in ${pluginName} execution:\n`;
      hooksTime.forEach((measureInfo) => {
        output += `    Hook ${measureInfo.name} time took ${getOutputTime(measureInfo.start, measureInfo.end)}\n`;
      });
    });

    output += `Time event\n`;

    Object.keys(this.timeEvent).forEach((eventName) => {
      const eventTime = this.timeEvent[eventName];
      output += `  Event ${eventName} time took ${getOutputTime(eventTime.start, eventTime.end)}\n`;
    });

    return output;
  }
}

export default TimeMeasure;