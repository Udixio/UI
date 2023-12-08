import type {FunctionComponent, ReactNode} from "react";

export interface AvatarProps {

    /**
     * Optional class name for the card component.
     */
    className?: string;

    /**
     * content of avatar component.
     */
    children: string | ReactNode

}

export const Avatar: FunctionComponent<AvatarProps> = ({className, children}: AvatarProps) => {
    const ElementType = typeof children == "string" ? "p" : "div"
    return(
        <div className={`flex rounded-full w-10 h-10 bg-primary ${className}`}>
            <ElementType className={"text-surface m-auto"}>
                {children}
            </ElementType>
        </div>
    )
};
