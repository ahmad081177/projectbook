import {
  AlignmentType,
  type IParagraphOptions,
  type IRunOptions,
} from 'docx';

export const RTL_PARA: Partial<IParagraphOptions> = {
  bidirectional: true,
  alignment: AlignmentType.RIGHT,
  spacing: { line: 360, lineRule: 'auto' },
};

export const LTR_PARA: Partial<IParagraphOptions> = {
  bidirectional: false,
  alignment: AlignmentType.LEFT,
};

export const HEBREW_RUN: Partial<IRunOptions> = {
  font: 'David MT',
  size: 24, // 12pt in half-points
};

export const CODE_RUN: Partial<IRunOptions> = {
  font: 'Courier New',
  size: 20, // 10pt
};

export const HEADING1_RUN: Partial<IRunOptions> = {
  ...HEBREW_RUN,
  bold: true,
  size: 28, // 14pt
};

export const HEADING2_RUN: Partial<IRunOptions> = {
  ...HEBREW_RUN,
  bold: true,
  size: 26, // 13pt
};


