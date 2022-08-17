/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { SelectControlItem } from '@woocommerce/components';

type CategoryFieldAddNewItemProps = {
	item: SelectControlItem;
	onClick: () => void;
};

export const CategoryFieldAddNewItem: React.FC<
	CategoryFieldAddNewItemProps
> = ( { item, onClick } ) => {
	return (
		<Button
			variant="tertiary"
			className="category-field-dropdown__item category-field-dropdown__new-item"
			onClick={ () => {
				onClick();
			} }
		>
			<div className="category-field-dropdown__item-content">
				<Icon
					className="category-field-dropdown__toggle"
					icon={ plus }
					size={ 24 }
				/>
				{ sprintf( __( 'Create "%s"', 'woocommerce' ), item.label ) }
			</div>
		</Button>
	);
};
