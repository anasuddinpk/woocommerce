/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Modal, TextControl } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	__experimentalSelectControl as SelectControl,
	__experimentalSelectControlItem as SelectControlItem,
} from '@woocommerce/components';
import { recordEvent } from '@woocommerce/tracks';
import {
	EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME,
	ProductCategory,
} from '@woocommerce/data';
import classnames from 'classnames';
import { debounce } from 'lodash';

/**
 * Internal dependencies
 */
import './create-category-modal.scss';
import { useCategorySearch } from './use-category-search';
import { CategoryFieldItem } from './category-field-item';

type CreateCategoryModalProps = {
	initialCategoryName?: string;
	onCancel: () => void;
	onCreated: ( newCategory: ProductCategory ) => void;
};

export const CreateCategoryModal: React.FC< CreateCategoryModalProps > = ( {
	initialCategoryName,
	onCancel,
	onCreated,
} ) => {
	const {
		categories,
		topCategoryKeyValues,
		searchCategories,
		getFilteredItems,
	} = useCategorySearch();
	const { createNotice } = useDispatch( 'core/notices' );
	const [ isCreating, setIsCreating ] = useState( false );
	const { createProductCategory, invalidateResolutionForStoreSelector } =
		useDispatch( EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME );
	const [ categoryName, setCategoryName ] = useState(
		initialCategoryName || ''
	);
	const [ categoryParent, setCategoryParent ] =
		useState< SelectControlItem | null >( null );

	const onSave = async () => {
		recordEvent( 'product_category_add', {
			new_product_page: true,
		} );
		setIsCreating( true );
		try {
			const newCategory: ProductCategory = await createProductCategory( {
				name: categoryName,
				parent: categoryParent ? categoryParent.value : undefined,
			} );
			invalidateResolutionForStoreSelector( 'getProductCategories' );
			setIsCreating( false );
			onCreated( newCategory );
		} catch ( e ) {
			createNotice(
				'error',
				__( 'Failed to create category.', 'woocommerce' )
			);
			setIsCreating( false );
			onCancel();
		}
	};

	const onInputChange = ( searchString?: string ) => {
		searchCategories( searchString || '' );
	};

	const searchDelayed = useMemo(
		() => debounce( onInputChange, 150 ),
		[ onInputChange ]
	);

	const dropdownItems = ( categories || [] )
		.slice( 0, 10 )
		.map( ( cat ) => ( {
			value: cat.data.id.toString(),
			label: cat.data.name,
		} ) );

	return (
		<Modal
			title={ __( 'Create category', 'woocommerce' ) }
			onRequestClose={ () => onCancel() }
			className="woocommerce-create-new-category-modal"
		>
			<div className="woocommerce-create-new-category-modal__wrapper">
				<TextControl
					label={ __( 'Name', 'woocommerce' ) }
					name="Tops"
					value={ categoryName }
					onChange={ setCategoryName }
				/>
				<SelectControl
					items={ dropdownItems }
					label={ __( 'Parent category (optional)', 'woocommerce' ) }
					selected={ categoryParent }
					onSelect={ ( item: SelectControlItem ) =>
						item && setCategoryParent( item )
					}
					onRemove={ () => setCategoryParent( null ) }
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
										return (
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
												selectedIds={
													categoryParent
														? [
																parseInt(
																	categoryParent.value,
																	10
																),
														  ]
														: []
												}
												onSelect={ (
													selectedItem,
													isAdding
												) =>
													setCategoryParent(
														isAdding
															? {
																	value: selectedItem.id.toString(),
																	label: selectedItem.name,
															  }
															: null
													)
												}
											/>
										);
									} ) }
							</div>
						);
					} }
				</SelectControl>
				<div className="woocommerce-create-new-category-modal__buttons">
					<Button isSecondary onClick={ () => onCancel() }>
						{ __( 'Cancel', 'woocommerce' ) }
					</Button>
					<Button
						isPrimary
						disabled={ categoryName.length === 0 || isCreating }
						isBusy={ isCreating }
						onClick={ () => {
							onSave();
						} }
					>
						{ __( 'Save', 'woocommerce' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
};
