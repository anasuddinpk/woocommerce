/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Modal, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { recordEvent } from '@woocommerce/tracks';
import {
	EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME,
	ProductCategory,
	ProductCategoryActions,
} from '@woocommerce/data';

/**
 * Internal dependencies
 */
import './create-category-modal.scss';

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
	const { createNotice } = useDispatch( 'core/notices' );
	const [ isCreating, setIsCreating ] = useState( false );
	const { createProductCategory, invalidateResolutionForStoreSelector } =
		useDispatch( EXPERIMENTAL_PRODUCT_CATEGORIES_STORE_NAME );
	const [ categoryName, setCategoryName ] = useState(
		initialCategoryName || ''
	);

	const onSave = async () => {
		recordEvent( 'product_category_add', {
			new_product_page: true,
		} );
		setIsCreating( true );
		try {
			const newCategory: ProductCategory = await createProductCategory( {
				name: categoryName,
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
