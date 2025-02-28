import { window, workspace, WorkspaceConfiguration } from "vscode";
import { Settings } from "./enums";

class ExtensionSettings {
  private static _instance: ExtensionSettings;
  public static get instance(): ExtensionSettings {
    if (!ExtensionSettings._instance) {
      ExtensionSettings._instance = new ExtensionSettings();
    }
    return ExtensionSettings._instance;
  }
  private configs: WorkspaceConfiguration;

  /**
   * Gets triggered when any of the extension configuration changes.
   * @param _configs : the key of the configuration
   */
  public Update(_configs: WorkspaceConfiguration) {
    this.configs = _configs;
  }

  /**
   * Get the extension's configs
   * @param _section The extension's identifier
   * @returns Workspace's configuration for the extension
   */
  private getPerLanguage<T>(_section: string) {
    // Check if the window has an active editor (document file)
    if (!window.activeTextEditor) return;
    // Get the current active editor languageid
    const language_Id = window.activeTextEditor.document.languageId;
    // Get the configuration of the active language id
    const lang_config: WorkspaceConfiguration = workspace.getConfiguration(Settings.identifier, { languageId: language_Id });
    // return the configuration for the given section
    return lang_config.get<T>(_section);
  }

  /**
   * Get list of language ids that has configuration
   * @returns List of language ids
   */
  private getLanguagesWithRegex(): string[] {
    // skip unnecessary keys excludedSettings
    const excludedSettings: string[] = ["inlineFold", "supportedLanguages"];
    const settings = Object.values(Settings).filter((v) => !excludedSettings.includes(v));
    const langs = [];
    settings.forEach((v) => {
      const lang = this.configs.inspect(v).languageIds;
      if (lang) {
        langs.push(...lang);
      }
    });
    return langs;
  }

  /**
   * Get typed configuration for the given settings key
   * @param _section : the key of the configuration
   * @returns Language's scoped configuration or fall back to global configuration
   */
  public Get<T>(_section: Settings): T {
    // Try to get language scope configuration, otherwise fallback to global configuration
    const getGlobal = this.configs.get(Settings.useGlobal)
    if (getGlobal) {
      return this.configs.get<T>(_section) as T
    }
    return (this.getPerLanguage<T>(_section) as T) ?? (this.configs.get<T>(_section) as T);
  }

  /**
   * Get supported langauges from global configuration and add any language id
   * that has configuration for the extension's regex and regex group
   * @returns List all of the supported language ids
   */
  public GetSupportedLanguages(): string[] {
    const langs: string[] = this.Get<string[]>(Settings.supportedLanguages);
    const withLangs: string[] = this.getLanguagesWithRegex();
    const supported: string[] = [...new Set([...langs, ...withLangs])];
    return supported;
  }

  public Regex(): RegExp {
    return RegExp(this.Get<RegExp>(Settings.regex), this.Get<string>(Settings.regexFlags));
  }

  constructor () { }
}

// Yes, a singleton :0
export const ExtSettings = ExtensionSettings.instance;
