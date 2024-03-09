#!/bin/env python3
import csv
import math
import re
import sqlite3

prefixed_bcvwp = re.compile('^[onON]\d')
gloss_needing_cleanup = re.compile('^(.+\..+)+$')

# read schema script
schemaFd = open('create-project-db.sql', 'r')
sqlScript = schemaFd.read()
schemaFd.close()

# create db connection
conn = sqlite3.connect('project.db')
cur = conn.cursor()

# execute schema script
for command in sqlScript.split(';'):
    cur.execute(command)


def sanitizeBCVWP(bcv_id):
    trimmed = bcv_id.strip()
    if prefixed_bcvwp.match(trimmed):
        trimmed = trimmed[1:]
    if len(trimmed) < 11:
        raise RuntimeError('invalid bcv_id: ' + bcv_id)
    elif len(trimmed) == 11:
        trimmed += '1'
    return trimmed


def parseBCVWP(bcv_id):
    sanitized = sanitizeBCVWP(bcv_id)
    book = sanitized[0:2]
    chapter = sanitized[2:5]
    verse = sanitized[5:8]
    word = sanitized[8:11]
    part = sanitized[11:12]
    return {
        'book': int(book) if book is not None else None,
        'chapter': int(chapter) if chapter is not None else None,
        'verse': int(verse) if verse is not None else None,
        'word': int(word) if word is not None else None,
        'part': int(part) if len(part) > 0 else None
    }


def val(value):
    if value is None or type(value) == str and value.strip() == '':
        return 'NULL'
    return f'"{value}"'


def insertLanguage(language):
    existing = cur.execute(f'SELECT code FROM language WHERE code = "{language.get("code")}"').fetchone()
    if existing is not None:
        return
    cur.execute(
        f'INSERT INTO language (code, text_direction, font_family) VALUES ({val(language.get("code"))}, {val(language.get("textDirection"))}, {val(language.get("fontFamily"))})')
    conn.commit()


def insertCorpus(corpus):
    insertLanguage(corpus['language'])
    cur.execute(
        f'INSERT INTO corpora (id, side, name, full_name, language_id) VALUES ({val(corpus.get("id"))}, {val(corpus.get("side"))}, {val(corpus.get("name"))}, {val(corpus.get("fullName"))}, {val(corpus.get("language").get("code"))})')
    conn.commit()


def insertWordOrPart(corpus_id, language_id, word):
    cur.execute(
        f'INSERT INTO words_or_parts (id, corpus_id, side, text, after, gloss, position_book, position_chapter, position_verse, position_word, position_part, normalized_text, language_id) VALUES ({val(word.get("id"))}, {val(corpus_id)}, {val(word.get("side"))}, {val(word.get("text"))}, {val(word.get("after"))}, {val(word.get("gloss"))}, {val(word.get("position_book"))}, {val(word.get("position_chapter"))}, {val(word.get("position_verse"))}, {val(word.get("position_word"))}, {val(word.get("position_part"))}, {val(word.get("normalized_text"))}, {val(language_id)})')


def cleanupGloss(gloss):
    if gloss is None:
        return None
    if gloss_needing_cleanup.match(gloss):
        return gloss.replace('.', ' ')
    return gloss


def readCorpus(metadata, tsvFile):
    insertCorpus(metadata)
    corpus_id = metadata.get('id')
    language_id = metadata.get('language').get('code')
    total_rows = 0
    with open(tsvFile) as tsvFd:
        total_rows = len(tsvFd.readlines())
    with open(tsvFile) as tsvFd:
        corpus = csv.reader(tsvFd, delimiter='\t', quotechar='"')
        header = next(corpus)
        idx_id = header.index('xml:id')
        idx_text = header.index('text')
        idx_lemma = header.index('lemma')
        idx_after = header.index('after')
        idx_gloss = header.index('gloss')
        idx_english = header.index('english')
        idx = 0
        last_percentage = -1
        for row in corpus:
            id = sanitizeBCVWP(row[idx_id])
            text = row[idx_text] or row[idx_lemma]
            after = row[idx_after]
            gloss = cleanupGloss(row[idx_gloss] or row[idx_english])
            bcvwp = parseBCVWP(row[idx_id])
            insertWordOrPart(corpus_id, language_id, {
                'id': f'{metadata.get("side")}:{id}',
                'corpus_id': metadata.get('id'),
                'side': metadata.get('side'),
                'text': text,
                'after': after,
                'gloss': gloss,
                'position_book': bcvwp.get('book'),
                'position_chapter': bcvwp.get('chapter'),
                'position_verse': bcvwp.get('verse'),
                'position_word': bcvwp.get('word'),
                'position_part': bcvwp.get('part'),
                'normalized_text': text.lower()
            })
            current_percentage = math.floor((idx / total_rows) * 100)
            if idx % 1000 == 0:
                conn.commit()
            if current_percentage != last_percentage:
                last_percentage = current_percentage
                print(f'{metadata.get("id")}: {last_percentage}%')
            idx += 1
    conn.commit()


readCorpus({
    'id': 'wlc-hebot',
    'name': 'WLC',
    'fullName': 'Macula Hebrew Old Testament',
    'side': 'sources',
    'language': {
        'code': 'heb',
        'textDirection': 'rtl',
        'fontFamily': 'sbl-hebrew'
    }
}, '../src/tsv/source_macula_hebrew.tsv')

readCorpus({
    'id': 'sbl-gnt',
    'name': 'SBLGNT',
    'fullName': 'SBL Greek New Testament',
    'side': 'sources',
    'language': {
        'code': 'grc',
        'textDirection': 'ltr',
    }
}, '../src/tsv/source_macula_greek_SBLGNT.tsv')

# open tsv files
# for tsvFile in ['../src/tsv/source_macula_hebrew.tsv', '../src/tsv/source_macula_greek_SBLGNT.tsv']:
