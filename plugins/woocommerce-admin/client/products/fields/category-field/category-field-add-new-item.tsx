/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __experimentalSelectControlItem as SelectControlItem } from '@woocommerce/components';
import classNames from 'classnames';

type CategoryFieldAddNewItemProps = {
	item: SelectControlItem;
	onClick: () => void;
	highlighted: boolean;
};

export const CategoryFieldAddNewItem: React.FC<
	CategoryFieldAddNewItemProps
> = ( { item, onClick, highlighted } ) => {
	return (
		<div
			className={ classNames(
				'category-field-dropdown__item category-field-dropdown__new-item',
				{
					item_highlighted: highlighted,
				}
			) }
		>
			<Button
				className="category-field-dropdown__item-content"
				onClick={ () => {
					onClick();
				} }
			>
				<Icon
					className="category-field-dropdown__toggle"
					icon={ plus }
					size={ 24 }
				/>
				{ sprintf( __( 'Create "%s"', 'woocommerce' ), item.label ) }
			</Button>
		</div>
	);
};
