/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
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
		isSearching,
		topCategoryKeyValues,
		searchCategories,
		getFilteredItems,
	} = useCategorySearch();

	const onInputChange = ( searchString?: string ) => {
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

	return (
		<SelectControl
			multiple
			items={ ( categories || [] ).slice( 0, 10 ).map( ( cat ) => ( {
				value: cat.data.id.toString(),
				label: cat.data.name,
			} ) ) }
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
							items.map(
								( item: SelectControlItem, index: number ) => (
									<CategoryFieldItem
										key={ `${ item.value }${ index }` }
										item={
											topCategoryKeyValues[
												parseInt( item.value, 10 )
											]
										}
										selectedIds={ selectedIds }
										onSelect={ onSelect }
									/>
								)
							) }
					</div>
				);
			} }
		</SelectControl>
	);
};
