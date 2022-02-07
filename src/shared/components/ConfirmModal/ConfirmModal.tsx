import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { isMobile } from 'react-device-detect';
import ConfirmModalInterface from './ConfirmModalInterface';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isConfirming,
  confirm,
  confirmColorScheme,
  cancel,
  title,
  isDisabled,
  children,
}: ConfirmModalInterface): ReactElement => (
  <AlertDialog
    isOpen={isOpen}
    onClose={onClose}
  >
    <AlertDialogOverlay />
    <AlertDialogContent
      position={isMobile ? 'fixed' : undefined}
      right={isMobile ? '250px' : undefined}
      opacity={isOpen ? '1 !important' : 0}
    >
      <AlertDialogHeader fontSize="lg" fontWeight="bold">
        {title}
      </AlertDialogHeader>

      <AlertDialogBody>
        {children}
      </AlertDialogBody>

      <AlertDialogFooter>
        <Button onClick={onClose} data-test="confirmation-cancel-button">
          {cancel}
        </Button>
        <Button
          colorScheme={confirmColorScheme}
          onClick={isDisabled ? noop : onConfirm}
          isLoading={isConfirming}
          disabled={isDisabled}
          ml={3}
          data-test="confirmation-confirm-button"
        >
          {confirm}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

ConfirmModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
};

ConfirmModal.defaultProps = {
  isDisabled: false,
};

export default ConfirmModal;
