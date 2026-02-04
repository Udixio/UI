
import React from 'react';
import { useMenuHeadlineStyle, MenuHeadlineInterface } from '../styles/menu-headline.style';
import { ReactProps } from '../utils';

export const MenuHeadline = ({ label, children, variant, className, ...restProps }: ReactProps<MenuHeadlineInterface> & { children?: React.ReactNode }) => {
    const styles = useMenuHeadlineStyle({ variant, className });
    return <div className={styles.headline} role="group" aria-label={label} {...restProps}>{children ?? label}</div>;
};
