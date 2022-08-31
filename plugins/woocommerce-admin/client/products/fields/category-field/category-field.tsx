/**
 * External dependencies
 */
import { useMemo, useRef, useState } from '@wordpress/element';
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
import { CategoryFieldItem } from './category-field-item';
import { useCategorySearch } from './use-category-search';
import { CategoryFieldAddNewItem } from './category-field-add-new-item';
import { CreateCategoryModal } from './create-category-modal';

type CategoryFieldProps = {
	label: string;
	placeholder: string;
	value?: Pick< ProductCategory, 'id' | 'name' >[];
	onChange: ( value: Pick< ProductCategory, 'id' | 'name' >[] ) => void;
};

export const CategoryField: React.FC< CategoryFieldProps > = ( {
	label,
	placeholder,
	value = [],
	onChange,
} ) => {
	const {
		isSearching,
		categoriesSelectList,
		topCategoryKeyValues,
		searchCategories,
		getFilteredItems,
	} = useCategorySearch();
	const [ showCreateNewModal, setShowCreateNewModal ] = useState( false );
	const [ searchValue, setSearchValue ] = useState( '' );

	const onInputChange = ( searchString?: string ) => {
		setSearchValue( searchString || '' );
		searchCategories( searchString || '' );
	};

	const searchDelayed = useMemo(
		() => debounce( onInputChange, 150 ),
		[ onInputChange ]
	);

	const onSelect = (
		item: Pick< ProductCategory, 'id' | 'name' >,
		selected: boolean
	) => {
		if ( selected ) {
			onChange( [ ...value, { id: item.id, name: item.name } ] );
		} else {
			onChange( value.filter( ( i ) => i.id !== item.id ) );
		}
	};

	const selectedIds = value.map( ( item ) => item.id );
	let selectControlItems = categoriesSelectList;
	// Add the add new button if search value does not exist.
	if (
		searchValue.length > 0 &&
		categoriesSelectList.length > 0 &&
		! categoriesSelectList.find(
			( cat ) =>
				cat.value === 'add-new' ||
				cat.label.toLowerCase() === searchValue.toLowerCase()
		)
	) {
		selectControlItems.push( { value: 'add-new', label: searchValue } );
	} else {
		selectControlItems = categoriesSelectList.filter(
			( cat ) => cat.value !== 'add-new'
		);
	}
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
					{ name: item.label, id: parseInt( item.value, 10 ) },
					! selectedIds.includes( parseInt( item.value, 10 ) )
				)
			}
			onRemove={ ( item: SelectControlItem ) =>
				item &&
				onSelect(
					{ name: item.label, id: parseInt( item.value, 10 ) },
					false
				)
			}
			onInputChange={ searchDelayed }
			getFilteredItems={ getFilteredItems }
			placeholder={ selected.length === 0 ? placeholder : '' }
		>
			{ ( {
				items,
				isOpen,
				getMenuProps,
				selectItem,
				highlightedIndex,
				setInputValue,
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
											!! topCategoryKeyValues[
												parseInt( item.value, 10 )
											] || item.value === 'add-new'
									)
									.map( ( item: SelectControlItem ) => {
										return item.value === 'add-new' ? (
											<CategoryFieldAddNewItem
												key={ item.value }
												highlighted={
													highlightedIndex ===
													items.indexOf( item )
												}
												item={ item }
												onClick={ () =>
													setShowCreateNewModal(
														true
													)
												}
											/>
										) : (
											<CategoryFieldItem
												key={ `${ item.value }` }
												item={
													topCategoryKeyValues[
														parseInt(
															item.value,
															10
														)
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
										);
									} ) }
						</div>
						{ showCreateNewModal && (
							<CreateCategoryModal
								initialCategoryName={ searchValue }
								onCancel={ () =>
									setShowCreateNewModal( false )
								}
								onCreated={ ( newCategory ) => {
									onSelect( newCategory, true );
									setInputValue( '' );
									setShowCreateNewModal( false );
								} }
							/>
						) }
					</>
				);
			} }
		</SelectControl>
	);
};
