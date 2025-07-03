import { CommandParameters } from '../wsi-proxy-api/command/data.model';

export class FormatHelper {

  public static validateParameterDescriptor(commandParameter: CommandParameters): void {
    if (commandParameter && commandParameter.EnumerationTexts) {
      commandParameter.EnumerationTexts.forEach(item => {
        if (item.Descriptor === undefined || item.Descriptor.trim().length === 0) {
          item.Descriptor = `(${item.Value})`;
        }
      });
    }
  }
}
