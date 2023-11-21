import React from 'react';
import BCVNavigation, {BCVNavigationProps, Book, Division} from './BCVNavigation';
import {Meta} from "@storybook/react";

const meta: Meta<typeof BCVNavigation> = {
    title: "BCVNavigation",
    component: BCVNavigation
};

export default meta;

const divisions: Division[] = [
    {
        title: 'Old Testament',
        books: [
            {
                title: 'Genesis',
                chapters: [
                    {
                        reference: 1,
                        verses: 31
                    },
                    {
                        reference: 2,
                        verses: 25
                    },
                    {
                        reference: 3,
                        verses: 21
                    },
                    {
                        reference: 4,
                        verses: 25
                    },
                    {
                        reference: 5,
                        verses: 32
                    },
                    {
                        reference: 6,
                        verses: 22
                    },
                    {
                        reference: 7,
                        verses: 24
                    },
                    {
                        reference: 8,
                        verses: 22
                    },
                    {
                        reference: 9,
                        verses: 28
                    },
                    {
                        reference: 10,
                        verses: 32
                    },
                    {
                        reference: 11,
                        verses: 32
                    },
                    {
                        reference: 12,
                        verses: 20
                    },
                    {
                        reference: 13,
                        verses: 18
                    },
                    {
                        reference: 14,
                        verses: 24
                    },
                    {
                        reference: 15,
                        verses: 21
                    },
                    {
                        reference: 16,
                        verses: 16
                    },
                    {
                        reference: 17,
                        verses: 27
                    },
                    {
                        reference: 18,
                        verses: 33
                    },
                    {
                        reference: 19,
                        verses: 38
                    },
                    {
                        reference: 20,
                        verses: 18
                    },
                    {
                        reference: 21,
                        verses: 34
                    },
                    {
                        reference: 22,
                        verses: 24
                    },
                    {
                        reference: 23,
                        verses: 20
                    },
                    {
                        reference: 24,
                        verses: 67
                    },
                    {
                        reference: 25,
                        verses: 34
                    },
                    {
                        reference: 26,
                        verses: 35
                    },
                    {
                        reference: 27,
                        verses: 46
                    },
                    {
                        reference: 28,
                        verses: 22
                    },
                    {
                        reference: 29,
                        verses: 35
                    },
                    {
                        reference: 30,
                        verses: 43
                    },
                    {
                        reference: 31,
                        verses: 55
                    },
                    {
                        reference: 32,
                        verses: 32
                    },
                    {
                        reference: 33,
                        verses: 20
                    },
                    {
                        reference: 34,
                        verses: 31
                    },
                    {
                        reference: 35,
                        verses: 29
                    },
                    {
                        reference: 36,
                        verses: 43
                    },
                    {
                        reference: 37,
                        verses: 36
                    },
                    {
                        reference: 38,
                        verses: 30
                    },
                    {
                        reference: 39,
                        verses: 23
                    },
                    {
                        reference: 40,
                        verses: 23
                    },
                    {
                        reference: 41,
                        verses: 57
                    },
                    {
                        reference: 42,
                        verses: 38
                    },
                    {
                        reference: 43,
                        verses: 34
                    },
                    {
                        reference: 44,
                        verses: 34
                    },
                    {
                        reference: 45,
                        verses: 28
                    },
                    {
                        reference: 46,
                        verses: 34
                    },
                    {
                        reference: 47,
                        verses: 31
                    },
                    {
                        reference: 48,
                        verses: 22
                    },
                    {
                        reference: 49,
                        verses: 33
                    },
                    {
                        reference: 50,
                        verses: 26
                    }
                ]
            },
            {
                title: 'Exodus',
                chapters: [
                    {
                        reference: 1,
                        verses: [
                            { reference: '1' },
                            { reference: '2' },
                            { reference: '3' },
                            { reference: '4' },
                            { reference: '5' },
                            { reference: '6' },
                            { reference: '7' },
                            { reference: '8' },
                            { reference: '9' },
                            { reference: '10' },
                            { reference: '11' },
                            { reference: '12' },
                            { reference: '13' },
                            { reference: '14' },
                            { reference: '15' },
                            { reference: '16' },
                            { reference: '17' },
                            { reference: '18' },
                            { reference: '19' },
                            { reference: '20' },
                            { reference: '21' },
                            { reference: '22' }
                        ]
                    },
                    {
                        reference: 2,
                        verses: [
                            { reference: '1' },
                            { reference: '2' },
                            { reference: '3' },
                            { reference: '4' },
                            { reference: '5' },
                            { reference: '6' },
                            { reference: '7' },
                            { reference: '8' },
                            { reference: '9' },
                            { reference: '10' },
                            { reference: '11' },
                            { reference: '12' },
                            { reference: '13' },
                            { reference: '14' },
                            { reference: '15' },
                            { reference: '16' },
                            { reference: '17' },
                            { reference: '18' },
                            { reference: '19' },
                            { reference: '20' },
                            { reference: '21' },
                            { reference: '22' },
                            { reference: '23' },
                            { reference: '24' },
                            { reference: '25' }
                        ]
                    }
                ]
            },
            {
                title: 'Leviticus',
                chapters: []
            },
            {
                title: 'Numbers',
                chapters: []
            },
            {
                title: 'Deuteronomy',
                chapters: []
            },
            {
                title: 'Joshua',
                chapters: []
            },
            {
                title: 'Judges',
                chapters: []
            },
            {
                title: 'Ruth',
                chapters: []
            },
            {
                title: '1 Samuel',
                chapters: []
            },
            {
                title: '2 Samuel',
                chapters: []
            },
            {
                title: '1 Kings',
                chapters: []
            },
            {
                title: '2 Kings',
                chapters: []
            },
            {
                title: '1 Chronicles',
                chapters: []
            },
            {
                title: '2 Chronicles',
                chapters: []
            },
            {
                title: 'Ezra',
                chapters: []
            },
            {
                title: 'Nehemiah',
                chapters: []
            },
            {
                title: 'Esther',
                chapters: []
            },
            {
                title: 'Job',
                chapters: []
            },
            {
                title: 'Psalms',
                chapters: []
            },
            {
                title: 'Proverbs',
                chapters: []
            },
            {
                title: 'Ecclesiastes',
                chapters: []
            },
            {
                title: 'Song of Solomon',
                chapters: []
            },
            {
                title: 'Isaiah',
                chapters: []
            },
            {
                title: 'Jeremiah',
                chapters: []
            },
            {
                title: 'Lamentations',
                chapters: []
            },
            {
                title: 'Ezekiel',
                chapters: []
            },
            {
                title: 'Daniel',
                chapters: []
            },
            {
                title: 'Hosea',
                chapters: []
            },
            {
                title: 'Joel',
                chapters: []
            },
            {
                title: 'Amos',
                chapters: []
            },
            {
                title: 'Obadiah',
                chapters: []
            },
            {
                title: 'Jonah',
                chapters: []
            },
            {
                title: 'Micah',
                chapters: []
            },
            {
                title: 'Nahum',
                chapters: []
            },
            {
                title: 'Habakkuk',
                chapters: []
            },
            {
                title: 'Haggai',
                chapters: []
            },
            {
                title: 'Zechariah',
                chapters: []
            },
            {
                title: 'Malachi',
                chapters: []
            }
        ]
    },
    {
        title: 'New Testament',
        books: [
            {
                title: 'Matthew',
                chapters: []
            },
            {
                title: 'Mark',
                chapters: []
            },
            {
                title: 'Luke',
                chapters: []
            },
            {
                title: 'John',
                chapters: []
            },
            {
                title: 'Acts',
                chapters: []
            },
            {
                title: 'Romans',
                chapters: []
            },
            {
                title: '1 Corinthians',
                chapters: []
            },
            {
                title: '2 Corinthians',
                chapters: []
            },
            {
                title: 'Galatians',
                chapters: []
            },
            {
                title: 'Ephesians',
                chapters: []
            },
            {
                title: 'Philippians',
                chapters: []
            },
            {
                title: 'Colossians',
                chapters: []
            },
            {
                title: '1 Thessalonians',
                chapters: []
            },
            {
                title: '2 Thessalonians',
                chapters: []
            },
            {
                title: '1 Timothy',
                chapters: []
            },
            {
                title: '2 Timothy',
                chapters: []
            },
            {
                title: 'Titus',
                chapters: []
            },
            {
                title: 'Philemon',
                chapters: []
            },
            {
                title: 'Hebrews',
                chapters: []
            },
            {
                title: 'James',
                chapters: []
            },
            {
                title: '1 Peter',
                chapters: []
            },
            {
                title: '2 Peter',
                chapters: []
            },
            {
                title: '1 John',
                chapters: []
            },
            {
                title: '2 John',
                chapters: []
            },
            {
                title: '3 John',
                chapters: []
            },
            {
                title: 'Jude',
                chapters: []
            },
            {
                title: 'Revelation',
                chapters: []
            }
        ]
    }
]

export const Default = (props: BCVNavigationProps) => <BCVNavigation {...props} />;
Default.args = {
    divisions: divisions
} as BCVNavigationProps

export const WithCurrentPosition = (props: BCVNavigationProps) => <BCVNavigation {...props} />;
WithCurrentPosition.args = {
    divisions: divisions,
    currentPosition: {
        division: 'Old Testament',
        book: 1,
        chapter: 2,
        verse: 15
    }
} as BCVNavigationProps
