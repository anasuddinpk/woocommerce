/**
 * External dependencies
 */
import { CheckboxControl, Icon } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { ProductCategory } from '@woocommerce/data';

export type CategoryTreeItem = {
	data: ProductCategory;
	children: CategoryTreeItem[];
	parentID: number;
	isOpen: boolean;
};

type CategoryFieldItemProps = {
	item: CategoryTreeItem;
	selectedIds: number[];
	onSelect: ( item: ProductCategory, value: boolean ) => void;
};

export const CategoryFieldItem: React.FC< CategoryFieldItemProps > = ( {
	item,
	selectedIds = [],
	onSelect,
} ) => {
	const [ isOpen, setIsOpen ] = useState( item.isOpen || false );
	return (
		<div className="category-field-dropdown__item">
			<div className="category-field-dropdown__item-content">
				{ item.children.length > 0 ? (
					<Icon
						className="category-field-dropdown__toggle"
						icon={ isOpen ? chevronUp : chevronDown }
						size={ 24 }
						onClick={ () => setIsOpen( ! isOpen ) }
					/>
				) : null }
				<CheckboxControl
					label={ item.data.name }
					checked={ selectedIds.includes( item.data.id ) }
					onChange={ ( checked ) => {
						onSelect( item.data, checked );
					} }
				/>
			</div>
			{ item.children.length > 0 && isOpen ? (
				<div className="category-field-dropdown__item-children">
					{ item.children.map( ( child ) => (
						<CategoryFieldItem
							key={ child.data.id }
							item={ child }
							selectedIds={ selectedIds }
							onSelect={ onSelect }
						/>
					) ) }
				</div>
			) : null }
		</div>
	);
};
