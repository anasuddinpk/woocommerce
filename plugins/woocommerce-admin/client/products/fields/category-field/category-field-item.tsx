/**
 * External dependencies
 */
import { CheckboxControl, Icon } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { ProductCategory } from '@woocommerce/data';
import { __experimentalSelectControlItem as SelectControlItem } from '@woocommerce/components';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { sortCategoryTreeItems } from './use-category-search';

export type CategoryTreeItem = {
	data: ProductCategory;
	item: SelectControlItem;
	children: CategoryTreeItem[];
	parentID: number;
	isOpen: boolean;
};

type CategoryFieldItemProps = {
	item: CategoryTreeItem;
	selectedIds: number[];
	selectControlItem?: { value: string; label: string };
	onSelect: ( item: SelectControlItem ) => void;
	items: SelectControlItem[];
	highlightedIndex: number;
};

export const CategoryFieldItem: React.FC< CategoryFieldItemProps > = ( {
	item,
	selectedIds = [],
	selectControlItem,
	onSelect,
	items,
	highlightedIndex,
} ) => {
	const [ isOpen, setIsOpen ] = useState( item.isOpen || false );
	const index = items.findIndex(
		( i ) => i.value === item.data.id.toString()
	);
	const children = sortCategoryTreeItems(
		item.children.filter( ( child ) => items.includes( child.item ) )
	);

	if ( highlightedIndex === index && children.length > 0 && ! isOpen ) {
		setIsOpen( true );
	}

	useEffect( () => {
		if ( item.isOpen !== isOpen ) {
			setIsOpen( item.isOpen );
		}
	}, [ item.isOpen ] );

	return (
		<div
			className={ classNames( 'category-field-dropdown__item', {
				item_highlighted: index === highlightedIndex,
			} ) }
		>
			<div className="category-field-dropdown__item-content">
				{ children.length > 0 ? (
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
					onChange={ () =>
						selectControlItem && onSelect( selectControlItem )
					}
				/>
			</div>
			{ children.length > 0 && isOpen ? (
				<div className="category-field-dropdown__item-children">
					{ children.map( ( child ) => (
						<CategoryFieldItem
							key={ child.data.id }
							item={ child }
							selectedIds={ selectedIds }
							selectControlItem={ child.item }
							onSelect={ onSelect }
							items={ items }
							highlightedIndex={ highlightedIndex }
						/>
					) ) }
				</div>
			) : null }
		</div>
	);
};
