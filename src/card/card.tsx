import { StylingHelper } from '../utils';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type {FunctionComponent, MouseEventHandler} from "react";

export type CardVariant = "outlined" | "fixed" | "elevated"

type image = {
    src: string
    alt: string
}

export interface CardProps {
    /**
     * The src and alt of image in card.
     */
    image?: image;

    /**
     * The button variant determines the style of the Card.
     */
    variant?: CardVariant;

    /**
     * Optional class name for the card component.
     */
    className?: string;

    /**
     * is horizontal card
     */
    horizontal?: boolean;

    /**
     * Optional class name for the state layer in the button.
     */
    stateClassName?: "disabled" | "focused" | "hovered" | "pressed" | "dragged";
}

/**
 * The Button component is a versatile component that can be used to trigger actions or to navigate to different sections of the application
 */
export const Card: FunctionComponent<CardProps> = ({variant, horizontal, stateClassName}) => {

    let stateClass
    switch (stateClassName){
        case "disabled":
            stateClass = ""
        default:
            stateClass = ""
    }
    let variantClass
    switch (variant){
        case "outlined":
            variantClass = "bg-surface"
        case "fixed":
            variantClass = ""
        case "elevated":
            variantClass = ""
        default:
            variantClass = ""
    }

    return(
        <div className={variantClass}>

        </div>
    )
};
