/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { useSelect, resolveSelect } from '@wordpress/data';
import { __experimentalSelectControlItem as SelectControlItem } from '@woocommerce/components';
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

const PAGE_SIZE = 100;
const parentCategoryCache: Record< number, ProductCategory > = {};

/**
 * Recursive function to set isOpen to true for all the childrens parents.
 */
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

/**
 * Turn the category tree into a single select control item list.
 */
function getItemsListFromTree(
	items: SelectControlItem[] = [],
	treeItems: CategoryTreeItem[]
) {
	for ( const treeItem of treeItems ) {
		items.push( treeItem.item );
		if ( treeItem.children.length > 0 ) {
			getItemsListFromTree( items, treeItem.children );
		}
	}
	return items;
}

const sortCategoryListItems = (
	menuItems: SelectControlItem[]
): SelectControlItem[] => {
	return menuItems.sort( ( a, b ) => {
		return a.label.localeCompare( b.label );
	} );
};

export const sortCategoryTreeItems = (
	menuItems: CategoryTreeItem[]
): CategoryTreeItem[] => {
	return menuItems.sort( ( a, b ) => {
		return a.data.name.localeCompare( b.data.name );
	} );
};

/**
 * Recursive function to turn a category list into a tree and retrieve any missing parents.
 */
async function getCategoriesTreeWithMissingParents(
	newCategories: ProductCategory[],
	search: string
): Promise< [ SelectControlItem[], CategoryTreeItem[], boolean ] > {
	const items: Record< number, CategoryTreeItem > = {};
	const missingParents: number[] = [];
	let showAddNewCategoryItem = true;
	for ( const cat of newCategories ) {
		items[ cat.id ] = {
			data: cat,
			children: [],
			parentID: cat.parent,
			isOpen: false,
			item: {
				value: cat.id.toString(),
				label: cat.name,
			},
		};
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
					item: {
						value: parentCategoryCache[
							item.parentID
						].id.toString(),
						label: parentCategoryCache[ item.parentID ].name,
					},
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
			( search.length === 0 ||
				item.data.name.toLowerCase() === search.toLowerCase() )
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
				return getCategoriesTreeWithMissingParents(
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
	const categoryCheckboxList = getItemsListFromTree( [], categoryTreeList );

	return Promise.resolve( [
		sortCategoryListItems( categoryCheckboxList ),
		categoryTreeList,
		showAddNewCategoryItem,
	] );
}

export const useCategorySearch = () => {
	const { initialCategories = [], totalCount } = useSelect(
		( select: WCDataSelector ) => {
			const { getProductCategories, getProductCategoriesTotalCount } =
				select( EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME );
			return {
				initialCategories: getProductCategories( {
					per_page: PAGE_SIZE,
				} ),
				totalCount: getProductCategoriesTotalCount( {
					per_page: PAGE_SIZE,
				} ),
			};
		}
	);
	const [ isSearching, setIsSearching ] = useState( false );
	const [ categoriesAndNewItem, setCategoriesAndNewItem ] = useState<
		[ SelectControlItem[], CategoryTreeItem[], boolean ]
	>( [ [], [], true ] );
	const isAsync =
		! initialCategories ||
		( initialCategories.length > 0 && totalCount > PAGE_SIZE );

	useEffect( () => {
		if (
			initialCategories &&
			initialCategories.length > 0 &&
			categoriesAndNewItem[ 0 ].length === 0
		) {
			getCategoriesTreeWithMissingParents( initialCategories, '' ).then(
				( categoryTree ) => {
					setCategoriesAndNewItem( categoryTree );
				}
			);
		}
	}, [ initialCategories ] );

	const searchCategories = useCallback(
		async ( search: string ): Promise< CategoryTreeItem[] > => {
			if ( ! isAsync && initialCategories.length > 0 ) {
				return getCategoriesTreeWithMissingParents(
					initialCategories,
					search
				).then( ( categoryData ) => {
					setCategoriesAndNewItem( categoryData );
					return categoryData[ 1 ];
				} );
			}
			setIsSearching( true );
			try {
				const newCategories = await resolveSelect(
					EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME
				).getProductCategories( {
					search,
					per_page: PAGE_SIZE,
				} );

				const categoryTreeData =
					await getCategoriesTreeWithMissingParents(
						newCategories as ProductCategory[],
						search || ''
					);
				setIsSearching( false );
				setCategoriesAndNewItem( categoryTreeData );
				return categoryTreeData[ 1 ];
			} catch ( e ) {
				setIsSearching( false );
				return [];
			}
		},
		[ initialCategories ]
	);

	const topCategoryKeyValues: Record< number, CategoryTreeItem > = (
		categoriesAndNewItem[ 1 ] || []
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
							( topCategoryKeyValues[
								parseInt( item.value, 10 )
							] &&
								topCategoryKeyValues[
									parseInt( item.value, 10 )
								].isOpen ) ) )
			);
		},
		[ categoriesAndNewItem ]
	);

	return {
		searchCategories,
		getFilteredItems,
		categoriesSelectList: categoriesAndNewItem[ 0 ],
		categories: categoriesAndNewItem[ 1 ],
		showAddNewCategory: categoriesAndNewItem[ 1 ],
		isSearching,
		topCategoryKeyValues,
	};
};
