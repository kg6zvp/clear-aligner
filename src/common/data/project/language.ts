export enum TextDirectionDTO {
  ltr,
  rtl
}

export interface LanguageDTO {
  code: string;
  textDirection: TextDirectionDTO;
  fontFamily: string;
}
