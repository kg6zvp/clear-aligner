import React from 'react';
import BCVNavigation, {BCVNavigationProps} from './BCVNavigation';
import {Meta} from "@storybook/react";
import BCVWP from "../BCVWP/BCVWPSupport";

const meta: Meta<typeof BCVNavigation> = {
    title: "BCVNavigation",
    component: BCVNavigation
};

export default meta;

export const Default = (props: BCVNavigationProps) => <BCVNavigation {...props} />;
Default.args = {
    words: [
        {
            id: '45005003001'
        },
        {
            id: '48006002001'
        }
    ]
} as BCVNavigationProps

export const WithCurrentPositionAtGalatians6_2 = (props: BCVNavigationProps) => <BCVNavigation {...props} />;
WithCurrentPositionAtGalatians6_2.args = {
    words: [
        {
            id: '45005003001'
        },
        {
            id: '48006002001'
        }
    ],
    currentPosition: new BCVWP(48, 6, 2)
} as BCVNavigationProps
