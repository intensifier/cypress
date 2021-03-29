import * as React from 'react'
import { SVGAttributes } from 'react'
import cs from 'classnames'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { TextSize } from '../../css'
import { textSizeToClassName } from '../text/StyledText'

import styles from './Icon.module.scss'

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  className?: string

  // TODO: Limit literals to only those available in the iconset
  icon: IconName

  // TODO: Is there ever a need for the icon to not take a square space as long as it's properly centered?
  /**
   * Defaults to 'm'
   */
  size?: TextSize
}

// Currently only a passthrough for FontAwesome. This provides a single place to swap out the icon library
export const Icon: React.FC<IconProps> = ({ className, size, icon, ...props }) =>
  <FontAwesomeIcon {...props} className={cs(textSizeToClassName(size ?? 'm'), styles.icon, className)} icon={icon} />
