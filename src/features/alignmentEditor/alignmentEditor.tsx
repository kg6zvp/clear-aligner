/**
 * This file contains the AlignmentEditor component
 * The AlignmentEditor wraps the BCVNavigation and
 * Workbench components
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import { CorpusContainer, Word } from '../../structs';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';
import { AppContext } from '../../App';
import { ControlPanelFormat, UserPreference } from 'state/preferences/tableManager';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import _ from 'lodash';
import { useAppDispatch } from '../../app/index';
import { resetTextSegments } from '../../state/alignment.slice';
import { Button, ButtonGroup, Stack, SvgIcon, Toolbar, Tooltip } from '@mui/material';
import { Box } from '@mui/system';
import AppBar from '@mui/material/AppBar';
import { ProfileAvatar } from '../profileAvatar/profileAvatar';
import { SwapHoriz, SwapVert } from '@mui/icons-material';

const defaultDocumentTitle = 'ClearAligner';

interface AlignmentEditorProps {
  showNavigation?: boolean;
}

export const AlignmentEditor: React.FC<AlignmentEditorProps> = ({ showNavigation = true }) => {
  const layoutCtx = useContext(LayoutContext);
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorporaContainers, setSelectedCorporaContainers] = useState(
    [] as CorpusContainer[]
  );
  const appCtx = useContext(AppContext);
  const dispatch = useAppDispatch();
  const currentPosition = useMemo<BCVWP>(() => appCtx.preferences?.bcv ?? new BCVWP(1, 1, 1), [appCtx.preferences?.bcv]);

  useEffect(() => {
    if (sourceContainer && targetContainer)
      setSelectedCorporaContainers([sourceContainer, targetContainer]);
  }, [sourceContainer, targetContainer]);

  useEffect(() => {
    if (currentPosition) {
      layoutCtx.setWindowTitle(
        `${defaultDocumentTitle}: ${
          currentPosition.getBookInfo()?.EnglishBookName
        } ${currentPosition?.chapter}:${currentPosition?.verse}`
      );
    } else {
      layoutCtx.setWindowTitle(defaultDocumentTitle);
    }
  }, [currentPosition, layoutCtx]);

  useEffect(() => {
    if (!targetContainer) {
      return;
    }
    const loadSourceWords = async () => {
      setAvailableWords(
        targetContainer?.corpora.flatMap(({ words }) => words) ?? []
      );
    };
    void loadSourceWords().catch(console.error);
  }, [targetContainer?.corpora, setAvailableWords, targetContainer]);

  // reset selected tokens when the book, chapter or verse changes
  useEffect(() => {
    dispatch(resetTextSegments());
  }, [appCtx.preferences?.bcv, dispatch]);

  const saveControlPanelFormat = useCallback(async () => {
    const alignmentDirection = appCtx.preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL]
      ? ControlPanelFormat[ControlPanelFormat.HORIZONTAL]
      : ControlPanelFormat[ControlPanelFormat.VERTICAL];
    const updatedPreferences = {
      ...appCtx.preferences,
      alignmentDirection
    } as UserPreference;
    appCtx.projectState.userPreferenceTable?.saveOrUpdate(updatedPreferences);
    appCtx.setPreferences(updatedPreferences);
  }, [appCtx]);

  return (
    <Stack direction={'column'} minWidth={'100%'} height={'100%'}>
      {/*App Bar*/}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="static"
        >
          <Toolbar>
            <ButtonGroup>
              <Tooltip
                title={`Swap to horizontal view mode`}
                arrow describeChild>
                <span>
                  <Button
                    variant={appCtx.preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.HORIZONTAL] ? 'outlined' : 'contained'}
                    disabled={appCtx.preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.HORIZONTAL] ? true : false}
                    onClick={() => void saveControlPanelFormat()}
                  >
                        <SwapHoriz />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip
                title={`Swap to vertical view mode`}
                arrow describeChild>
                <span>
                  <Button
                    variant={appCtx.preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL] ? 'outlined' : 'contained'}
                    disabled={appCtx.preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL] ? true : false}
                    onClick={() => void saveControlPanelFormat()}
                  >
                        <SwapVert />
                  </Button>
                </span>
              </Tooltip>
            </ButtonGroup>
            <ButtonGroup>
              <Tooltip title="Toggle Glosses" arrow describeChild>
                <span>
                  <Button
                    variant={appCtx.preferences?.showGloss ? 'contained' : 'outlined'}
                    disabled={!selectedCorporaContainers.some(container => container.corpusAtReferenceString(currentPosition?.toReferenceString?.() ?? '')?.hasGloss)}
                    onClick={() => {
                      const updatedPreferences = {
                        ...((appCtx.preferences ?? {}) as UserPreference),
                        showGloss: !appCtx.preferences?.showGloss
                      };
                      appCtx.setPreferences(updatedPreferences);
                    }}
                  >
                    <SvgIcon>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M6.26564 9.20241C6.58441 9.4776 6.96509 9.81701 7.41228 10.2183C7.85947 10.6197 8.33418 11.0508 8.83641 11.5095C9.33864 11.9704 9.84546 12.4428 10.3592 12.9267C10.8729 13.4106 11.3521 13.8715 11.7948 14.3073C11.9392 14.454 12.086 14.6031 12.2305 14.7522L13.2785 11.9337C13.2372 11.8947 13.1959 11.858 13.1547 11.8168C12.9001 11.5783 12.5928 11.2962 12.2328 10.9705C12.9185 10.3101 13.4689 9.73674 13.8816 9.25286C14.2944 8.76898 14.6155 8.3516 14.8402 8.00531C15.065 7.65902 15.214 7.36778 15.2851 7.13386C15.3562 6.89995 15.3906 6.70272 15.3906 6.54449C15.3906 6.3358 15.2943 6.10418 15.1017 5.84733C14.909 5.59277 14.5696 5.24649 14.0857 4.81306C13.8679 4.62042 13.6936 4.46218 13.5583 4.33605C13.4253 4.20992 13.3198 4.10443 13.2441 4.01729C13.1684 3.93014 13.118 3.84758 13.0928 3.7719C13.0675 3.69623 13.0561 3.61367 13.0561 3.52194C13.0561 3.47148 13.0561 3.41645 13.0629 3.35911C13.0675 3.30178 13.0744 3.23069 13.0813 3.14584C12.9987 3.10456 12.9024 3.06557 12.7923 3.03347C12.6845 2.99907 12.5951 2.99219 12.5286 3.00824C11.9278 3.56092 11.5012 4.01729 11.2558 4.38192C11.0082 4.74655 10.8866 5.02863 10.8866 5.22814C10.8866 5.3451 10.9004 5.45288 10.9302 5.55379C10.96 5.65469 11.0173 5.76477 11.1068 5.88631C11.1939 6.00786 11.3177 6.14316 11.476 6.29452C11.6342 6.44588 11.8406 6.62934 12.0906 6.8472C12.4002 7.11552 12.6203 7.33338 12.7488 7.50537C12.8772 7.67737 12.9437 7.85854 12.9437 8.05118C12.9437 8.17731 12.9162 8.30573 12.8611 8.44104C12.8061 8.57405 12.7189 8.7254 12.5974 8.89281C12.4759 9.06022 12.3222 9.25515 12.1342 9.47531C11.9461 9.69776 11.7191 9.95002 11.4508 10.2344C11.0747 9.89269 10.6825 9.53493 10.272 9.16113C9.86151 8.78961 9.45331 8.40893 9.04281 8.01907C8.63231 7.62921 8.22869 7.23706 7.83195 6.84032C7.43521 6.44358 7.06141 6.05602 6.71054 5.67992C6.5179 5.46206 6.36425 5.26254 6.24729 5.07908C6.13034 4.89562 6.0386 4.71903 5.9721 4.55162C5.90559 4.38421 5.85973 4.2191 5.8345 4.05627C5.80928 3.89345 5.79781 3.72375 5.79781 3.54946V3.34765C5.79781 3.27197 5.8024 3.20088 5.80928 3.13437C5.71754 3.09309 5.61205 3.06557 5.4951 3.05181C5.37814 3.04035 5.27265 3.04493 5.18091 3.07016C4.96305 3.44626 4.74748 3.81548 4.53421 4.18011C4.32093 4.54474 4.11912 4.92543 3.92649 5.32675C3.8187 5.55149 3.76366 5.7877 3.76366 6.0285C3.76366 6.23031 3.80724 6.41836 3.89438 6.59953C3.98153 6.7784 4.10307 6.96645 4.25901 7.15679C4.41266 7.34943 4.59383 7.54895 4.79794 7.75764C5.00204 7.96633 5.22219 8.19565 5.45611 8.44792C5.08001 8.94097 4.75895 9.38587 4.49064 9.78261C4.22232 10.1793 4.00446 10.5486 3.83246 10.8857C3.66047 11.2251 3.53663 11.537 3.45636 11.8259C3.3761 12.1149 3.33711 12.3924 3.33711 12.6607C3.33711 12.8785 3.36463 13.0964 3.41967 13.312C3.47471 13.5298 3.56415 13.7523 3.69028 13.9839C3.81641 14.2132 3.97923 14.4632 4.17875 14.7292C4.38056 14.9975 4.62594 15.2888 4.91948 15.6076C4.54338 15.8415 4.1948 16.0708 3.87145 16.2978C3.55039 16.5226 3.25914 16.7358 3 16.9377C3.02523 17.0454 3.0688 17.1509 3.13072 17.2518C3.19264 17.3527 3.25455 17.4307 3.31189 17.4903C3.86457 17.2977 4.31635 17.1532 4.67181 17.0569C5.02726 16.9606 5.33915 16.9124 5.60517 16.9124C5.85514 16.9124 6.07071 16.9514 6.25188 17.0317C6.43076 17.1119 6.61651 17.222 6.80915 17.3642L8.45114 15.5204C8.46719 15.4791 8.46719 15.4378 8.45114 15.3943C7.88241 14.892 7.40082 14.454 7.00866 14.0779C6.61651 13.7018 6.29545 13.3578 6.05007 13.0505C5.8024 12.7409 5.62352 12.4566 5.51115 12.1974C5.39878 11.9383 5.34144 11.6837 5.34144 11.4315C5.34144 11.1219 5.40107 10.7939 5.52261 10.4477C5.64416 10.1014 5.88725 9.684 6.25647 9.20011L6.26564 9.20241Z"
                          fill="#707070" />
                        <path
                          d="M17.8419 10.9062H15.9156L12.1592 20.999H14.3699L15.0625 18.919H18.7088L19.4083 20.999H21.619L17.8419 10.9062ZM15.6243 17.2357L16.8788 13.4587L18.1469 17.2357H15.6243Z"
                          fill="#707070" />
                      </svg>
                    </SvgIcon>
                  </Button>
                </span>
              </Tooltip>
            </ButtonGroup>
            {
              showNavigation && (
                <div style={{ display: 'grid', justifyContent: 'center' }}>
                  <br />
                  <BCVNavigation
                    horizontal
                    disabled={!availableWords || availableWords.length < 1}
                    words={availableWords}
                    currentPosition={currentPosition}
                    onNavigate={bcv => {
                      if (!_.isEqual(bcv, currentPosition)) {
                        appCtx.setPreferences((previousState): UserPreference => {
                          return {
                            ...previousState as UserPreference,
                            bcv
                          };
                        });
                      }
                    }}
                  />
                </div>
              )
            }
            <ProfileAvatar />
          </Toolbar>
        </AppBar>
      </Box>
      <Workbench
        corpora={selectedCorporaContainers}
        currentPosition={currentPosition}
      />
    </Stack>
  );
};
