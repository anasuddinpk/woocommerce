/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { useSelect, resolveSelect } from '@wordpress/data';
import { SelectControlItem } from '@woocommerce/components';
import {
	EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME,
	WCDataSelector,
	ProductCategory,
} from '@woocommerce/data';
import { escapeRegExp } from 'lodash';

/**
 * Internal dependencies
 */
import { CategoryTreeItem } from './category-field-item';

const PAGE_SIZE = 50;
const parentCategoryCache: Record< number, ProductCategory > = {};

function openParents(
	treeList: Record< number, CategoryTreeItem >,
	item: CategoryTreeItem
) {
	if ( treeList[ item.parentID ] ) {
		treeList[ item.parentID ].isOpen = true;
		if ( treeList[ item.parentID ].parentID !== 0 ) {
			openParents( treeList, treeList[ item.parentID ] );
		}
	}
}

async function getParentCategories(
	newCategories: ProductCategory[],
	search: string
): Promise< [ CategoryTreeItem[], boolean ] > {
	const items: Record< number, CategoryTreeItem > = {};
	const parents: CategoryTreeItem[] = [];
	const missingParents: number[] = [];
	let showAddNewCategoryItem = true;
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
			if (
				parentCategoryCache[ item.parentID ] &&
				! items[ item.parentID ]
			) {
				items[ item.parentID ] = {
					data: parentCategoryCache[ item.parentID ],
					children: [],
					parentID: parentCategoryCache[ item.parentID ].parent,
					isOpen: false,
				};
			}
			if ( items[ item.parentID ] ) {
				items[ item.parentID ].children.push( item );
				parentCategoryCache[ item.parentID ] =
					items[ item.parentID ].data;
				const searchRegex = new RegExp( escapeRegExp( search ), 'i' );
				if ( search.length > 0 && searchRegex.test( item.data.name ) ) {
					openParents( items, item );
				}
			} else {
				missingParents.push( item.parentID );
			}
		}
		if (
			showAddNewCategoryItem &&
			item.data.name.toLowerCase() === search.toLowerCase()
		) {
			showAddNewCategoryItem = false;
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
	const categoryTreeList = Object.values( items ).filter(
		( item ) => item.parentID === 0
	);

	return Promise.resolve( [ categoryTreeList, showAddNewCategoryItem ] );
}

export const useCategorySearch = () => {
	const { initialCategories = [] } = useSelect(
		( select: WCDataSelector ) => {
			const { getProductCategories } = select(
				EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME
			);
			return {
				initialCategories: getProductCategories( {
					per_page: PAGE_SIZE,
				} ),
			};
		}
	);
	const [ isSearching, setIsSearching ] = useState( false );
	const [ showAddNewCategoryItem, setShowAddNewCategoryItem ] =
		useState( false );
	const [ categoriesAndNewItem, setCategoriesAndNewItem ] = useState<
		[ CategoryTreeItem[], boolean ]
	>( [ [], true ] );
	const isAsync =
		! initialCategories ||
		( initialCategories.length > 0 &&
			initialCategories.length > PAGE_SIZE );

	useEffect( () => {
		if (
			initialCategories &&
			initialCategories.length > 0 &&
			categoriesAndNewItem[ 0 ].length === 0
		) {
			getParentCategories( initialCategories, '' ).then(
				( categoryTree ) => {
					setCategoriesAndNewItem( categoryTree );
				}
			);
		}
	}, [ initialCategories ] );

	const searchCategories = useCallback(
		async ( search: string ): Promise< CategoryTreeItem[] > => {
			if ( ! isAsync && initialCategories.length > 0 ) {
				return getParentCategories( initialCategories, search ).then(
					( categoryData ) => {
						setCategoriesAndNewItem( categoryData );
						return categoryData[ 0 ];
					}
				);
			}
			setIsSearching( false );
			try {
				const newCategories = await resolveSelect(
					EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME
				).getProductCategories( {
					search,
					per_page: PAGE_SIZE,
				} );

				const categoryTreeData = await getParentCategories(
					newCategories as ProductCategory[],
					search || ''
				);
				setIsSearching( false );
				setCategoriesAndNewItem( categoryTreeData );
				return categoryTreeData[ 0 ];
			} catch ( e ) {
				setIsSearching( false );
				return [];
			}
		},
		[ initialCategories ]
	);

	const topCategoryKeyValues: Record< number, CategoryTreeItem > = (
		categoriesAndNewItem[ 0 ] || []
	).reduce( ( items, treeItem ) => {
		items[ treeItem.data.id ] = treeItem;
		return items;
	}, {} as Record< number, CategoryTreeItem > );

	const getFilteredItems = useCallback(
		(
			allItems: SelectControlItem[],
			inputValue: string,
			selectedItems: SelectControlItem[]
		) => {
			const searchRegex = new RegExp( escapeRegExp( inputValue ), 'i' );
			return allItems.filter(
				( item ) =>
					item.value === 'add-new' ||
					( selectedItems.indexOf( item ) < 0 &&
						( searchRegex.test( item.label ) ||
							topCategoryKeyValues[ parseInt( item.value, 10 ) ]
								.isOpen ) )
			);
		},
		[ categoriesAndNewItem ]
	);

	return {
		searchCategories,
		getFilteredItems,
		categories: categoriesAndNewItem[ 0 ],
		showAddNewCategory: categoriesAndNewItem[ 1 ],
		isSearching,
		topCategoryKeyValues,
	};
};
