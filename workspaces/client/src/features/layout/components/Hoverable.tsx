import classNames from 'classnames';
import {
  Children,
  cloneElement,
  FocusEventHandler,
  PointerEventHandler,
  ReactElement,
  Ref,
  useState,
} from 'react';
import { useMergeRefs } from 'use-callback-ref';

interface Props {
  children: ReactElement<{
    className?: string;
    onBlur?: FocusEventHandler<HTMLElement>;
    onFocus?: FocusEventHandler<HTMLElement>;
    onPointerEnter?: PointerEventHandler<HTMLElement>;
    onPointerLeave?: PointerEventHandler<HTMLElement>;
    ref?: Ref<unknown>;
  }>;
  classNames: {
    default?: string;
    hovered?: string;
  };
}

export const Hoverable = (props: Props) => {
  const child = Children.only(props.children);
  const mergedRef = useMergeRefs([child.props.ref].filter((v) => v != null));
  const [isHovered, setIsHovered] = useState(false);

  return cloneElement(child, {
    className: classNames(
      child.props.className,
      'cursor-pointer',
      isHovered ? props.classNames.hovered : props.classNames.default,
    ),
    onBlur: (event) => {
      child.props.onBlur?.(event);
      setIsHovered(false);
    },
    onFocus: (event) => {
      child.props.onFocus?.(event);
      setIsHovered(true);
    },
    onPointerEnter: (event) => {
      child.props.onPointerEnter?.(event);
      setIsHovered(true);
    },
    onPointerLeave: (event) => {
      child.props.onPointerLeave?.(event);
      setIsHovered(false);
    },
    ref: mergedRef,
  });
};
