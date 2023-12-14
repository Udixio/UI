import type {FunctionComponent, ReactNode} from "react";


export interface CardContentProps {

    /**
     * Optional class name for the card component.
     */
    className?: string;

    children?: ReactNode

    title?: string

    subTitle?: string
}

/**
 * The MediaCard component is the media of the card
 */
export const CardContent: FunctionComponent<CardContentProps> = ({children, title, subTitle}: CardContentProps) => {

    return(
        <div className={"flex flex-col pt-4 px-4 gap-8"}>
            {(title || subTitle) && <div>
                <p className={"text-body-large text-on-surface"}>{title}</p>
                <p className={"text-body-medium text-on-surface-variant"}>{subTitle}</p>
            </div>}
            {children}
        </div>
    )
};