import type { FunctionComponent } from "react";
import classNames from "classnames";
import Icon from "@/components/Icon";
import {faPlus, IconDefinition} from "@fortawesome/pro-regular-svg-icons";


interface ButtonProps {
  href?: string;
  title?: string;
  label: string;
  icon?: IconDefinition;
  className?: string;
  elevated?: boolean;
  outlined?: boolean;
  tonal?: boolean
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  size?: 'small' | 'medium' | 'large';
  type?: "button" | "submit" | "reset" | undefined;
}

const Button: FunctionComponent<ButtonProps> = ({
    elevated,
    tonal,
                                                    icon,
                                                  href,
                                                  title,
                                                  label,
                                                  className = "",
                                                  outlined,
                                                  onClick,
                                                  size,
                                                  type,
                                                }) => {
  // Détermine le type de l'élément à rendre : un bouton ou un lien
  const ElementType = href ? "a" : "button";



  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      onClick(e);
    }
  };



  let linkProps: any = {};
  if(href) {
    linkProps.href = href
    linkProps.title = title
  }

  let buttonProps: any = {};
  if(!href) {
    buttonProps.type = type
    buttonProps.onClick = {handleClick}
  }

  return (
      <ElementType
          href={href}
          title={title}
          className={classNames(
              className,
              "flex gap-2 justify-center items-center rounded-full  active:bg-primary-50 focus:bg-primary-50 hover:shadow-1  px-6 py-2.5",
              {
                  "no-underline": href,
                  "": elevated,
                  "bg-primary hover:bg-primary/50": !tonal && !outlined,
                  "bg-primary-80 ": tonal,
              }
          )}
          {...buttonProps}
          {...linkProps}
      >
          {icon && ( <Icon icon={faPlus} className="h-[18px] w-[18px] text-primary-100"/>)}
        <span className="text-primary-100">{label}</span>
      </ElementType>
  );
};

export default Button;
