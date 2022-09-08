/**
 * External dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import {
	Spinner,
	__experimentalSelectControl as SelectControl,
	__experimentalSelectControlItem as SelectControlItem,
} from '@woocommerce/components';
import { ProductCategory } from '@woocommerce/data';
import { debounce } from 'lodash';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './category-field.scss';
import { CategoryFieldItem, CategoryTreeItem } from './category-field-item';
import { useCategorySearch } from './use-category-search';

type CategoryFieldProps = {
	label: string;
	placeholder: string;
	value?: Pick< ProductCategory, 'id' | 'name' >[];
	onChange: ( value: Pick< ProductCategory, 'id' | 'name' >[] ) => void;
};

/**
 * Recursive function that adds the current item to the selected list and all it's parents
 * if not included already.
 */
function getSelectedWithParents(
	selected: Pick< ProductCategory, 'id' | 'name' >[] = [],
	item: ProductCategory,
	treeKeyValues: Record< number, CategoryTreeItem >
): Pick< ProductCategory, 'id' | 'name' >[] {
	selected.push( { id: item.id, name: item.name } );

	const parentId = item.parent
		? item.parent
		: treeKeyValues[ item.id ].parentID;
	if (
		parentId > 0 &&
		treeKeyValues[ parentId ] &&
		! selected.find(
			( selectedCategory ) => selectedCategory.id === parentId
		)
	) {
		getSelectedWithParents(
			selected,
			treeKeyValues[ parentId ].data,
			treeKeyValues
		);
	}

	return selected;
}

export const CategoryField: React.FC< CategoryFieldProps > = ( {
	label,
	placeholder,
	value = [],
	onChange,
} ) => {
	const {
		isSearching,
		categoriesSelectList,
		categoryTreeKeyValues,
		searchCategories,
		getFilteredItems,
	} = useCategorySearch();
	const [ searchValue, setSearchValue ] = useState( '' );

	const onInputChange = ( searchString?: string ) => {
		setSearchValue( searchString || '' );
		searchCategories( searchString || '' );
	};

	const searchDelayed = useMemo(
		() => debounce( onInputChange, 150 ),
		[ onInputChange ]
	);

	const onSelect = ( item: ProductCategory, selected: boolean ) => {
		if ( selected ) {
			onChange(
				getSelectedWithParents(
					[ ...value ],
					item,
					categoryTreeKeyValues
				)
			);
		} else {
			onChange( value.filter( ( i ) => i.id !== item.id ) );
		}
	};

	const selectedIds = value.map( ( item ) => item.id );
	const selectControlItems = categoriesSelectList;

	// converted selected items to the select control format.
	const selected = ( value || [] ).map( ( cat ) => ( {
		value: cat.id.toString(),
		label: cat.name,
	} ) );

	return (
		<SelectControl
			multiple
			items={ selectControlItems }
			label={ label }
			selected={ selected }
			onSelect={ ( item: SelectControlItem ) =>
				item &&
				onSelect(
					categoryTreeKeyValues[ parseInt( item.value, 10 ) ].data,
					! selectedIds.includes( parseInt( item.value, 10 ) )
				)
			}
			onRemove={ ( item: SelectControlItem ) =>
				item &&
				onSelect(
					categoryTreeKeyValues[ parseInt( item.value, 10 ) ].data,
					false
				)
			}
			onInputChange={ searchDelayed }
			getFilteredItems={ getFilteredItems }
			placeholder={ selected.length === 0 ? placeholder : '' }
			keepMenuOpenOnSelect={ true }
		>
			{ ( {
				items,
				isOpen,
				getMenuProps,
				selectItem,
				highlightedIndex,
			} ) => {
				return (
					<>
						<div
							{ ...getMenuProps() }
							className={ classnames(
								'woocommerce-select-control__menu',
								{
									'is-open': isOpen,
									'category-field-dropdown__menu': isOpen,
								}
							) }
						>
							{ isOpen && isSearching && items.length === 0 && (
								<div className="category-field-dropdown__item">
									<div className="category-field-dropdown__item-content">
										<Spinner />
									</div>
								</div>
							) }
							{ isOpen &&
								items.length > 0 &&
								items
									.filter(
										( item ) =>
											categoryTreeKeyValues[
												parseInt( item.value, 10 )
											]?.parentID === 0 ||
											item.value === 'add-new'
									)
									.map( ( item: SelectControlItem ) => (
										<CategoryFieldItem
											key={ `${ item.value }` }
											item={
												categoryTreeKeyValues[
													parseInt( item.value, 10 )
												]
											}
											highlightedIndex={
												highlightedIndex
											}
											selectControlItem={ item }
											selectedIds={ selectedIds }
											onSelect={ selectItem }
											items={ items }
										/>
									) ) }
						</div>
					</>
				);
			} }
		</SelectControl>
	);
};
