/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ProductStatus, ProductType, Product } from '@woocommerce/data';
import moment from 'moment';

export const validate = (
	values: Partial< Product< ProductStatus, ProductType > >
) => {
	const errors: {
		[ key: string ]: string;
	} = {};
	if ( ! values.name?.length ) {
		errors.name = __( 'This field is required.', 'woocommerce' );
	}

	if ( values.name && values.name.length > 120 ) {
		errors.name = __(
			'Please enter a product name shorter than 120 characters.',
			'woocommerce'
		);
	}

	if ( values.regular_price && ! /^[0-9.,]+$/.test( values.regular_price ) ) {
		errors.regular_price = __(
			'Please enter a price with one monetary decimal point without thousand separators and currency symbols.',
			'woocommerce'
		);
	}

	if ( values.sale_price && ! /^[0-9.,]+$/.test( values.sale_price ) ) {
		errors.sale_price = __(
			'Please enter a price with one monetary decimal point without thousand separators and currency symbols.',
			'woocommerce'
		);
	}

	const dateOnSaleFrom = moment(
		values.date_on_sale_from,
		moment.ISO_8601,
		true
	);
	const dateOnSaleTo = moment(
		values.date_on_sale_to,
		moment.ISO_8601,
		true
	);

	if ( values.date_on_sale_from && ! dateOnSaleFrom.isValid() ) {
		errors.date_on_sale_from = __(
			'Please enter a valid date.',
			'woocommerce'
		);
	}

	if ( values.date_on_sale_to && ! dateOnSaleTo.isValid() ) {
		errors.date_on_sale_to = __(
			'Please enter a valid date.',
			'woocommerce'
		);
	}

	if ( dateOnSaleFrom.isAfter( dateOnSaleTo ) ) {
		errors.date_on_sale_from = __(
			'The start date of the sale must be before the end date.',
			'woocommerce'
		);
	}

	if ( dateOnSaleTo.isBefore( dateOnSaleFrom ) ) {
		errors.date_on_sale_to = __(
			'The end date of the sale must be after the start date.',
			'woocommerce'
		);
	}

	return errors;
};
