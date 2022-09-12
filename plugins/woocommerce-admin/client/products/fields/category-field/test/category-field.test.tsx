/**
 * External dependencies
 */
import { ReactElement, Component } from 'react';
import { render, fireEvent } from '@testing-library/react';
import {
	Form,
	FormContext,
	__experimentalSelectControlItem as SelectControlItem,
} from '@woocommerce/components';
import { Product, ProductCategory } from '@woocommerce/data';

/**
 * Internal dependencies
 */
import { CategoryField } from '../category-field';
import {
	getCategoriesTreeWithMissingParents,
	useCategorySearch,
} from '../use-category-search';
import { CategoryTreeItem } from '../category-field-item';

const mockCategoryList = [
	{ id: 1, name: 'Clothing', parent: 0 },
	{ id: 2, name: 'Hoodies', parent: 1 },
	{ id: 3, name: 'Rain gear', parent: 0 },
] as ProductCategory[];

jest.mock( '@woocommerce/components', () => {
	const originalModule = jest.requireActual( '@woocommerce/components' );

	type ChildrenProps = {
		items: SelectControlItem[];
		isOpen: boolean;
		highlightedIndex: number;
		getMenuProps: () => Record< string, string >;
		selectItem: ( item: SelectControlItem ) => void;
		setInputValue: ( value: string ) => void;
	};
	type SelectControlProps = {
		children: ( {}: ChildrenProps ) => ReactElement | Component;
		items: SelectControlItem[];
		label: string;
		initialSelectedItems?: SelectControlItem[];
		itemToString?: ( item: SelectControlItem | null ) => string;
		getFilteredItems?: (
			allItems: SelectControlItem[],
			inputValue: string,
			selectedItems: SelectControlItem[]
		) => SelectControlItem[];
		multiple?: boolean;
		onInputChange?: ( value: string | undefined ) => void;
		onRemove?: ( item: SelectControlItem ) => void;
		onSelect?: ( selected: SelectControlItem ) => void;
		placeholder?: string;
		selected: SelectControlItem[];
	};

	return {
		...originalModule,
		__experimentalSelectControl: ( {
			children,
			items,
			selected,
		}: SelectControlProps ) => {
			return (
				<div>
					[select-control]
					<div className="selected">
						{ selected.map( ( item ) => (
							<div key={ item.value }>{ item.label }</div>
						) ) }
					</div>
					<div className="children">
						{ children( {
							items,
							isOpen: true,
							getMenuProps: () => ( {} ),
							selectItem: () => {},
							highlightedIndex: -1,
							setInputValue: () => {},
						} ) }
					</div>
				</div>
			);
		},
	};
} );
jest.mock( '@woocommerce/tracks', () => ( { recordEvent: jest.fn() } ) );

jest.mock( '../use-category-search', () => {
	const originalModule = jest.requireActual( '../use-category-search' );
	return {
		getCategoriesTreeWithMissingParents:
			originalModule.getCategoriesTreeWithMissingParents,
		useCategorySearch: jest.fn().mockReturnValue( {
			searchCategories: jest.fn(),
			getFilteredItems: jest.fn(),
			isSearching: false,
			categoriesSelectList: [],
			topCategoryKeyValues: {},
		} ),
	};
} );

describe( 'CategoryField', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render a dropdown select control', () => {
		const { queryByText } = render(
			<Form initialValues={ { categories: [] } }>
				{ ( { getInputProps }: FormContext< Product > ) => (
					<CategoryField
						label="Categories"
						placeholder="Search or create category…"
						{ ...getInputProps<
							Pick< ProductCategory, 'id' | 'name' >[]
						>( 'categories' ) }
					/>
				) }
			</Form>
		);
		expect( queryByText( '[select-control]' ) ).toBeInTheDocument();
	} );

	it( 'should pass in the selected categories as select control items', () => {
		const { queryByText } = render(
			<Form
				initialValues={ {
					categories: [
						{ id: 2, name: 'Test' },
						{ id: 5, name: 'Clothing' },
					],
				} }
			>
				{ ( { getInputProps }: FormContext< Product > ) => (
					<CategoryField
						label="Categories"
						placeholder="Search or create category…"
						{ ...getInputProps<
							Pick< ProductCategory, 'id' | 'name' >[]
						>( 'categories' ) }
					/>
				) }
			</Form>
		);
		expect( queryByText( 'Test' ) ).toBeInTheDocument();
		expect( queryByText( 'Clothing' ) ).toBeInTheDocument();
	} );

	describe( 'search values', () => {
		beforeEach( async () => {
			const items = await getCategoriesTreeWithMissingParents(
				mockCategoryList,
				''
			);
			( useCategorySearch as jest.Mock ).mockReturnValue( {
				searchCategories: jest.fn(),
				getFilteredItems: jest.fn(),
				isSearching: false,
				categoriesSelectList: items[ 0 ],
				topCategoryKeyValues: ( items[ 1 ] || [] ).reduce(
					( keyValues, treeItem ) => {
						keyValues[ treeItem.data.id ] = treeItem;
						return keyValues;
					},
					{} as Record< number, CategoryTreeItem >
				),
			} );
		} );

		it( 'should display only the parent categories passed in to the categoriesSelectList', () => {
			const { queryByText } = render(
				<Form
					initialValues={ {
						categories: [],
					} }
				>
					{ ( { getInputProps }: FormContext< Product > ) => (
						<CategoryField
							label="Categories"
							placeholder="Search or create category…"
							{ ...getInputProps<
								Pick< ProductCategory, 'id' | 'name' >[]
							>( 'categories' ) }
						/>
					) }
				</Form>
			);
			expect(
				queryByText( mockCategoryList[ 0 ].name )
			).toBeInTheDocument();
			const childParent = queryByText(
				mockCategoryList[ 1 ].name
			)?.parentElement?.closest(
				'.category-field-dropdown__item-children'
			);
			expect( childParent ).toBeInTheDocument();
			expect( childParent?.className ).not.toMatch(
				'category-field-dropdown__item-open'
			);
			expect(
				queryByText( mockCategoryList[ 2 ].name )
			).toBeInTheDocument();
		} );

		it( 'should show selected categories as selected', () => {
			const { getByLabelText } = render(
				<Form
					initialValues={ {
						categories: [ mockCategoryList[ 2 ] ],
					} }
				>
					{ ( { getInputProps }: FormContext< Product > ) => (
						<CategoryField
							label="Categories"
							placeholder="Search or create category…"
							{ ...getInputProps<
								Pick< ProductCategory, 'id' | 'name' >[]
							>( 'categories' ) }
						/>
					) }
				</Form>
			);
			const rainGearCheckbox = getByLabelText(
				mockCategoryList[ 2 ].name
			);
			expect( rainGearCheckbox ).toBeChecked();
			const clothingCheckbox = getByLabelText(
				mockCategoryList[ 0 ].name
			);
			expect( clothingCheckbox ).not.toBeChecked();
		} );

		it( 'should show selected categories as selected', () => {
			const { getByLabelText } = render(
				<Form
					initialValues={ {
						categories: [ mockCategoryList[ 2 ] ],
					} }
				>
					{ ( { getInputProps }: FormContext< Product > ) => (
						<CategoryField
							label="Categories"
							placeholder="Search or create category…"
							{ ...getInputProps<
								Pick< ProductCategory, 'id' | 'name' >[]
							>( 'categories' ) }
						/>
					) }
				</Form>
			);
			const rainGearCheckbox = getByLabelText(
				mockCategoryList[ 2 ].name
			);
			expect( rainGearCheckbox ).toBeChecked();
			const clothingCheckbox = getByLabelText(
				mockCategoryList[ 0 ].name
			);
			expect( clothingCheckbox ).not.toBeChecked();
		} );

		it( 'should include a toggle icon for parents that contain children', () => {
			const { getByLabelText } = render(
				<Form
					initialValues={ {
						categories: [ mockCategoryList[ 2 ] ],
					} }
				>
					{ ( { getInputProps }: FormContext< Product > ) => (
						<CategoryField
							label="Categories"
							placeholder="Search or create category…"
							{ ...getInputProps<
								Pick< ProductCategory, 'id' | 'name' >[]
							>( 'categories' ) }
						/>
					) }
				</Form>
			);
			const rainGearCheckboxParent = getByLabelText(
				mockCategoryList[ 0 ].name
			).parentElement?.closest(
				'.category-field-dropdown__item-content'
			);

			expect(
				rainGearCheckboxParent?.querySelector( 'svg' )
			).toBeInTheDocument();
		} );

		it( 'should allow user to toggle the parents using the svg button', () => {
			const { getByLabelText, queryByText } = render(
				<Form
					initialValues={ {
						categories: [ mockCategoryList[ 2 ] ],
					} }
				>
					{ ( { getInputProps }: FormContext< Product > ) => (
						<CategoryField
							label="Categories"
							placeholder="Search or create category…"
							{ ...getInputProps<
								Pick< ProductCategory, 'id' | 'name' >[]
							>( 'categories' ) }
						/>
					) }
				</Form>
			);
			const rainGearCheckboxParent = getByLabelText(
				mockCategoryList[ 0 ].name
			).parentElement?.closest(
				'.category-field-dropdown__item-content'
			);

			const toggle = rainGearCheckboxParent?.querySelector( 'svg' );
			if ( toggle ) {
				fireEvent.click( toggle );
			}
			const childParent = queryByText(
				mockCategoryList[ 1 ].name
			)?.parentElement?.closest(
				'.category-field-dropdown__item-children'
			);
			expect( childParent ).toBeInTheDocument();
			expect( childParent?.className ).toMatch(
				'category-field-dropdown__item-open'
			);
		} );
	} );
} );
