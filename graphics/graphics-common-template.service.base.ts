import { TemplateRef } from "@angular/core";

/**
 * NOTE: This service is used to import graphics-common into events.
 * It used to be the case that circular dependencies were allowed in Angular.
 *
 * Due to Angular's partial compilation mode, that type of import is no longer possible.
 * If this compilation issue becomes resolved due to changes in Angular's partial compilation mode,
 * then this service will be removed.
 */
export abstract class GraphicsCommonTemplateServiceBase {
  protected _graphicsCommonTemplate: TemplateRef<any> | undefined = undefined;
  public abstract get GraphicsCommonTemplate(): TemplateRef<any>;
  public abstract set GraphicsCommonTemplate(template: TemplateRef<any>);
}
