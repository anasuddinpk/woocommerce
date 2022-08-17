/**
 * External dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { SelectControl, SelectControlItem } from '@woocommerce/components';
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
	value?: Pick< ProductCategory, 'id' | 'name' >[];
	onChange: ( value: Pick< ProductCategory, 'id' | 'name' >[] ) => void;
};

export const CategoryField: React.FC< CategoryFieldProps > = ( {
	label,
	value = [],
	onChange,
} ) => {
	const {
		categories,
		showAddNewCategory,
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
	const dropdownItems = ( categories || [] )
		.slice( 0, 10 )
		.map( ( cat ) => ( {
			value: cat.data.id.toString(),
			label: cat.data.name,
		} ) );
	if ( showAddNewCategory ) {
		dropdownItems.push( { value: 'add-new', label: searchValue } );
	}

	return (
		<>
			<SelectControl
				multiple
				items={ dropdownItems }
				label={ label }
				selected={ ( value || [] ).map( ( cat ) => ( {
					value: cat.id.toString(),
					label: cat.name,
				} ) ) }
				onSelect={ ( item: SelectControlItem ) =>
					item &&
					onSelect(
						{ name: item.label, id: parseInt( item.value, 10 ) },
						true
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
			>
				{ ( { items, isOpen, getMenuProps } ) => {
					return (
						<div
							{ ...getMenuProps() }
							className={ classnames(
								'woocommerce-select-control__menu',
								{
									'is-open': isOpen,
									'category-field-dropdown__menu': true,
								}
							) }
						>
							{ isOpen &&
								items.map( ( item: SelectControlItem ) => {
									return item.value === 'add-new' ? (
										<CategoryFieldAddNewItem
											key={ item.value }
											item={ item }
											onClick={ () =>
												setShowCreateNewModal( true )
											}
										/>
									) : (
										<CategoryFieldItem
											key={ `${ item.value }` }
											item={
												topCategoryKeyValues[
													parseInt( item.value, 10 )
												]
											}
											selectedIds={ selectedIds }
											onSelect={ onSelect }
										/>
									);
								} ) }
						</div>
					);
				} }
			</SelectControl>
			{ showCreateNewModal && (
				<CreateCategoryModal
					initialCategoryName={ searchValue }
					onCancel={ () => setShowCreateNewModal( false ) }
					onCreated={ ( newCategory ) => {
						onSelect( newCategory, true );
						setShowCreateNewModal( false );
					} }
				/>
			) }
		</>
	);
};
