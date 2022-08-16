/**
 * External dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect, resolveSelect } from '@wordpress/data';
import { SelectControl, SelectControlItem } from '@woocommerce/components';
import {
	EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME,
	WCDataSelector,
	ProductCategory,
} from '@woocommerce/data';
import { debounce, escapeRegExp } from 'lodash';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './category-field.scss';
import { CategoryFieldItem, CategoryTreeItem } from './category-field-item';

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
	const { initialCategories = [] } = useSelect(
		( select: WCDataSelector ) => {
			const { getProductCategories } = select(
				EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME
			);
			return {
				initialCategories: getProductCategories( { per_page: 50 } ),
			};
		}
	);
	const [ categories, setCategories ] = useState< CategoryTreeItem[] >( [] );

	const getParentCategories = async (
		newCategories: ProductCategory[],
		search: string
	): Promise< CategoryTreeItem[] > => {
		const items: Record< number, CategoryTreeItem > = {};
		const parents: CategoryTreeItem[] = [];
		const missingParents: number[] = [];
		for ( const cat of newCategories ) {
			items[ cat.id ] = {
				data: cat,
				children: [],
				parentID: cat.parent,
				isOpen: false,
			};
			if ( cat.parent === 0 ) {
				parents.push( items[ cat.id ] );
			}
		}
		Object.keys( items ).forEach( ( key ) => {
			const item = items[ parseInt( key, 10 ) ];
			if ( item.parentID !== 0 ) {
				if ( items[ item.parentID ] ) {
					items[ item.parentID ].children.push( item );
					const searchRegex = new RegExp(
						escapeRegExp( search ),
						'i'
					);
					if (
						search.length > 0 &&
						! searchRegex.test( items[ item.parentID ].data.name )
					) {
						items[ item.parentID ].isOpen = true;
					}
				} else {
					missingParents.push( item.parentID );
				}
			}
		} );

		if ( missingParents.length > 0 ) {
			return resolveSelect( EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME )
				.getProductCategories( {
					include: missingParents,
				} )
				.then( ( parentCategories ) => {
					return getParentCategories(
						[
							...( parentCategories as ProductCategory[] ),
							...newCategories,
						],
						search
					);
				} );
		}
		return Promise.resolve(
			Object.values( items ).filter( ( item ) => item.parentID === 0 )
		);
	};

	useEffect( () => {
		if (
			initialCategories &&
			initialCategories.length > 0 &&
			categories.length === 0
		) {
			getParentCategories( initialCategories, '' ).then(
				( categoryTree ) => {
					setCategories( categoryTree );
				}
			);
		}
	}, [ initialCategories ] );

	const onInputChange = ( searchString?: string ) => {
		resolveSelect( EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME )
			.getProductCategories( {
				search: searchString,
				per_page: 50,
			} )
			.then( ( newCategories ) => {
				getParentCategories(
					newCategories as ProductCategory[],
					searchString || ''
				).then( ( categoryTree ) => {
					setCategories( categoryTree );
				} );
			} );
	};

	const searchDelayed = useMemo(
		() => debounce( onInputChange, 150 ),
		[ onInputChange ]
	);

	const onSelect = ( item: ProductCategory, selected: boolean ) => {
		if ( selected ) {
			onChange( [ ...value, { id: item.id, name: item.name } ] );
		} else {
			onChange( value.filter( ( i ) => i.id !== item.id ) );
		}
	};

	const selectedIds = value.map( ( item ) => item.id );
	const topCategoryKeyValues: Record< number, CategoryTreeItem > = (
		categories || []
	).reduce( ( items, treeItem ) => {
		items[ treeItem.data.id ] = treeItem;
		return items;
	}, {} as Record< number, CategoryTreeItem > );

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
					topCategoryKeyValues[ parseInt( item.value, 10 ) ].data,
					true
				)
			}
			onRemove={ ( item: SelectControlItem ) =>
				item &&
				onSelect(
					topCategoryKeyValues[ parseInt( item.value, 10 ) ].data,
					false
				)
			}
			onInputChange={ searchDelayed }
			getFilteredItems={ (
				allItems: SelectControlItem[],
				inputValue: string,
				selectedItems: SelectControlItem[]
			) => allItems }
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
