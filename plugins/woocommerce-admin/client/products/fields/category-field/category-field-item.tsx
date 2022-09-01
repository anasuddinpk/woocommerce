/**
 * External dependencies
 */
import { CheckboxControl, Icon } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { ProductCategory } from '@woocommerce/data';
import { __experimentalSelectControlItem as SelectControlItem } from '@woocommerce/components';
import classNames from 'classnames';

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
	openParent?: () => void;
};

export const CategoryFieldItem: React.FC< CategoryFieldItemProps > = ( {
	item,
	selectedIds = [],
	selectControlItem,
	onSelect,
	items,
	highlightedIndex,
	openParent,
} ) => {
	const [ isOpen, setIsOpen ] = useState( item.isOpen || false );
	const index = items.findIndex(
		( i ) => i.value === item.data.id.toString()
	);
	const children = item.children.filter( ( child ) =>
		items.includes( child.item )
	);

	useEffect( () => {
		if ( highlightedIndex === index && children.length > 0 && ! isOpen ) {
			setIsOpen( true );
		} else if ( highlightedIndex === index && openParent ) {
			// Make sure the parent is also open when the item is highlighted.
			openParent();
		}
	}, [ highlightedIndex ] );

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
						size={ 20 }
						onClick={ () => setIsOpen( ! isOpen ) }
					/>
				) : (
					<div className="category-field-dropdown__toggle-placeholder"></div>
				) }
				<CheckboxControl
					label={ item.data.name }
					checked={ selectedIds.includes( item.data.id ) }
					onChange={ () =>
						selectControlItem && onSelect( selectControlItem )
					}
				/>
			</div>
			{ children.length > 0 ? (
				<div
					className={ classNames(
						'category-field-dropdown__item-children',
						{
							'category-field-dropdown__item-open': isOpen,
						}
					) }
				>
					{ children.map( ( child ) => (
						<CategoryFieldItem
							key={ child.data.id }
							item={ child }
							selectedIds={ selectedIds }
							selectControlItem={ child.item }
							onSelect={ onSelect }
							items={ items }
							highlightedIndex={ highlightedIndex }
							openParent={ () => ! isOpen && setIsOpen( true ) }
						/>
					) ) }
				</div>
			) : null }
		</div>
	);
};
