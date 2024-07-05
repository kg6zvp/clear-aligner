import { AlignmentSide, Word } from '../../../structs';

export interface WordOrPartDTO {
  id: string;
  side: string;
  corpusId: string;
  text: string;
  after: string;
  gloss: string;
  sourceVerseBcv: string;
}

export const mapWordOrPartToWordOrPartDTO = (wordOrPart: Word): WordOrPartDTO => ({
  id: wordOrPart.id,
  side: wordOrPart.side,
  corpusId: wordOrPart.corpusId,
  text: wordOrPart.text,
  after: wordOrPart.after ?? "",
  gloss: wordOrPart.gloss ?? "",
  sourceVerseBcv: wordOrPart.sourceVerse ?? "",
});

export const mapWordOrPartDtoToWordOrPart = (wordOrPart: WordOrPartDTO): Word => ({
  id: wordOrPart.id,
  side: wordOrPart.side as unknown as AlignmentSide,
  corpusId: wordOrPart.corpusId,
  text: wordOrPart.text,
  after: wordOrPart.after,
  gloss: wordOrPart.gloss,
  sourceVerse: wordOrPart.sourceVerseBcv,
  position: 0,
  normalizedText: ''
});
