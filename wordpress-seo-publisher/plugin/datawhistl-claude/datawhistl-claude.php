<?php
/**
 * Plugin Name:       Datawhistl-Claude
 * Plugin URI:        https://datawhistl.com
 * Description:        Lets Claude publish SEO-optimized posts to this site via the REST API. Exposes the Yoast SEO focus keyword, SEO title, and meta description so they can be set programmatically when a post is created.
 * Version:           1.0.0
 * Author:            Datawhistl
 * License:           GPL-2.0-or-later
 * Requires at least: 6.0
 * Requires PHP:      7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // No direct access.
}

add_action( 'init', function () {
    $fields = array(
        '_yoast_wpseo_focuskw',   // Focus keyword
        '_yoast_wpseo_title',     // SEO title
        '_yoast_wpseo_metadesc',  // Meta description
    );

    foreach ( $fields as $key ) {
        register_post_meta( 'post', $key, array(
            'type'          => 'string',
            'single'        => true,
            'show_in_rest'  => true,
            // Only users allowed to edit posts may write these via REST.
            'auth_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
        ) );
    }
} );
