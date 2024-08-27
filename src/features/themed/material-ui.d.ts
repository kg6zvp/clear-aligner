/**
 * This file contains interfaces for MUI styles.
 */
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    unlinked: React.CSSProperties;
    selected: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    unlinked?: React.CSSProperties;
    selected?: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    unlinked: true;
    selected: true;
  }
}

// to allow for custom colors in the palette
declare module '@mui/material/styles' {
  interface Palette extends ColorOptions {

  }

  // allow configuration using `createTheme`
  interface PaletteOptions extends ColorOptions {

  }

  interface ColorOptions  {
    statusIndicators: {
      aligned: string;
      approved: string;
      flagged: string;
      rejected: string;
    },
    statusIndicatorsIcons: {
      aligned: string;
      rejected: string;
      approved: string;
      flagged: string;
    },
    toggleButtons: {
      disabled: {
        color: string;
        stroke: string;
        background: string;
        borderColor: string;
      }
      enabled: {
        color: string;
        stroke: string;
        background: string;
        borderColor: string;
      }
      hover: {
        color: string;
        stroke: string;
        background: string;
        borderColor: string;
      }
      selected: {
        color: string;
        stroke: string;
      },
    }
    highlightedText: {
      alignmentEditor: string,
    }
    tokenButtons: {
      defaultTokenButtons: {
        default: string;
        text: string;
        textContrast?: string;
        outline: string;
        rollover: string;
        selected: string;
      },
      alignedTokenButtons: {
        default: string;
        text: string;
        textContrast?: string;
        textReversed?: string;
        outline: string;
        rollover: string;
        selected: string;
        icons: string;
        iconsReversed?: string;
        iconsContrast?: string;
      },
      machineAlignedTokenButtons: {
        default: string;
        text: string;
        textContrast?: string;
        textReversed?: string;
        outline: string;
        rollover: string;
        selected: string;
        icons: string;
        iconsReversed?: string;
        iconsContrast?: string;
      },
      approvedTokenButtons: {
        default: string;
        text: string;
        textContrast?: string;
        textReversed?: string;
        outline: string;
        rollover: string;
        selected: string;
        icons: string;
        iconsReversed?: string;
        iconsContrast?: string;
      },
      flaggedTokenButtons: {
        default: string;
        text: string;
        textContrast?: string;
        textReversed?: string;
        outline: string;
        rollover: string;
        selected: string;
        icons: string;
        iconsReversed?: string;
        iconsContrast?: string;
      },
    },
    background: {
      paper: string;
      default: string;
    }
    transparent: string;
    linkStateSelector: {
      border: string;
    }
  }
}
