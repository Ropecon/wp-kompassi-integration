<?php
/**
 *  Plugin Name: Kompassi Integration
 *  Description:
 *  Author: Pasi Lallinaho
 *  Version: 2023
 *
 */

class WP_Plugin_Kompassi_Integration {
	function __construct( ) {
		add_action( 'init', array( &$this, 'init' ) );
		add_action( 'admin_init', array( &$this, 'admin_init' ) );
		add_action( 'admin_menu', array( &$this, 'admin_menu' ) );
		add_action( 'wp_enqueue_scripts', array( &$this, 'wp_enqueue_scripts' ) );
		add_action( 'enqueue_block_editor_assets', array( &$this, 'enqueue_block_editor_assets' ) );
		add_filter( 'block_categories_all', array( &$this, 'block_categories_all' ), 10, 2 );

		$this->ver = time( );
	}

	function init( ) {
		load_plugin_textdomain( 'kompassi-integration', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

		register_block_type(
			'kompassi-integration/programme',
			array(
				'editor_script' => 'kompassi-integration-blocks',
				'render_callback' => array( &$this, 'block_programme' ),
				'attributes' => array(
					'default_display' => array( 'type' => 'string', 'default' => 'list' ),
					'show_filters' => array( 'type' => 'boolean', 'default' => true ),
					'show_display_styles' => array( 'type' => 'boolean', 'default' => true )
				)
			)
		);
	}

	function admin_init( ) {
		add_settings_section( 'kompassi-integration-general', '', '', 'kompassi_integration_settings' );

		$fields = array(
			'feed_url' => array(
				'label' =>  __( 'Feed URL', 'kompassi-integration' ),
				'description' => __( 'Feed URL where programme data is loaded from.', 'kompassi-integration' )
			),
			'timeline_earliest_hour' => array(
				'label' =>  __( 'Earliest hour on timeline', 'kompassi-integration' ),
				'description' => __( 'Earliest hour to show on the timeline, when a single day is selected.', 'kompassi-integration' )
			)
		);

		foreach( $fields as $key => $data ) {
			$data['field_name'] = 'kompassi_integration_' . $key;
			$data['sanitize_callback'] = 'sanitize_text_field';
			add_settings_field( 'kompassi_integration_' . $key, $data['label'], array( &$this, 'setting_field' ), 'kompassi_integration_settings', 'kompassi-integration-general', $data );
			register_setting( 'kompassi_integration_settings', $data['field_name'], $data );
		}
	}

	function admin_menu( ) {
		add_menu_page( __( 'Kompassi Integration', 'kompassi-integration' ), 'Kompassi', 'manage_options', 'kompassi_integration_settings', array( &$this, 'admin_page_settings' ), 'dashicons-book', 100 );
	}

	function admin_page_settings( ) {
		echo '<div class="wrap"><form action="options.php" method="POST">';
		echo '<h1>' . __( 'Kompassi Integration', 'kompassi-integration' ) . '</h1>';
		settings_fields( 'kompassi_integration_settings' );
		do_settings_sections( 'kompassi_integration_settings' );
		submit_button( __( 'Save Changes', 'kompassi-integration' ) );
		echo '</form></div>';
	}

	function setting_field( $data ) {
		echo '<p><input type="text" id="' . $data['field_name'] . '" name="' . $data['field_name'] . '" class="widefat" value="' . get_option( $data['field_name'] ) . '"/></p>';
		if( isset( $data['description'] ) ) {
			echo '<p class="description">' . $data['description'] . '</p>';
		}
	}

	function wp_enqueue_scripts( ) {
		wp_enqueue_script( 'js-cookie', plugins_url( 'lib/js.cookie.min.js', __FILE__ ), array( ), '3.0.5' );
		wp_enqueue_script( 'kompassi-integration-frontend', plugins_url( 'frontend.js', __FILE__ ), array( 'jquery', 'wp-i18n', 'js-cookie' ), $this->ver );
		wp_set_script_translations( 'kompassi-integration-frontend', 'kompassi-integration', plugin_dir_path( __FILE__ ) . 'languages/' );
		$js_strings = array(
			'timeline_earliest_hour' => get_option( 'kompassi_integration_timeline_earliest_hour', 8 )
		);
		wp_localize_script( 'kompassi-integration-frontend', 'options', $js_strings );

		wp_enqueue_style( 'kompassi-integration-frontend', plugins_url( 'frontend.css', __FILE__ ), array( ), $this->ver );
		wp_enqueue_style( 'kompassi-integration-fonts', plugins_url( 'fonts/fonts.css', __FILE__ ), array( ), $this->ver );
	}

	function enqueue_block_editor_assets( ) {
		wp_register_script( 'kompassi-integration-blocks', plugins_url( 'blocks.js', __FILE__ ), array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-i18n' ), $this->ver );
		wp_set_script_translations( 'kompassi-integration-blocks', 'kompassi-integration', plugin_dir_path( __FILE__ ) . 'languages/' );
	}

	function block_categories_all( $categories, $editor_context ) {
		if( !$editor_context instanceof WP_Block_Editor_Context ) {
			return $categories;
		}

		$categories[] = array(
			'slug' => 'kompassi',
			'title' => 'Kompassi',
		);

		return $categories;
	}

	/*
	 *  Fetch data from the feed URL
	 *  TODO: Caching?
	 *
	 */

	function get_data( ) {
		// Get programme JSON and convert it into array
		// TODO: Only allow specific format, eg. only ask for the event slug?
		$json = file_get_contents( get_option( 'kompassi_integration_feed_url' ) );
		$programme = json_decode( $json, true );

		// Sort programme by event starting time
		// TODO: Is this required?
		usort( $programme, array( &$this, 'sort_by_starting_time' ) );

		return $programme;
	}

	/*
	 *  Show the Programme block
	 *
	 */

	function block_programme( $attributes ) {
		$html_attrs = array( 'class' => '' );
		if( isset( $attributes['align'] ) ) { $html_attrs['class'] .= ' align' . $attributes['align']; }
		if( $attributes['show_filters'] ) { $html_attrs['data-show-filters'] = 'true'; }
		if( $attributes['show_display_styles'] ) { $html_attrs['data-show-display-styles'] = 'true'; }

		$out = '<div ' . get_block_wrapper_attributes( $html_attrs ) . '>';

		/*  Programme  */
		$out .= '<section id="kompassi_programme" class="programme-list ' . $attributes['default_display'] . '">';
		foreach( $this->get_data( ) as $p ) {
			$out .= $this->markup_program( $p );
		}
		$out .= '</section>';

		$out .= '</div>';
		return $out;
	}

	/*
	 *  Return markup for a single program event
	 *
	 */

	function markup_program( $programme ) {
		ob_start( );
		$attrs = array(
			'id' => $programme['identifier'],
			'length' => $programme['length'],
			'start-timestamp' => strtotime( $programme['start_time'] ),
			'end-timestamp' => strtotime( $programme['end_time'] ),
		);
		$html_attrs = '';
		foreach( $attrs as $attr => $value ) {
			$html_attrs .= ' data-' . $attr . '="' . $value . '"';
		}
		$programme['description'] = nl2br( $programme['description'] );
		?>
			<article id="<?php echo $programme['identifier']; ?>" class="kompassi-programme" <?php echo $html_attrs; ?>>
				<?php
					$show_keys = array(
							'title' => '<strong>%s</strong>',
							'room_name' => '%s',
//							'start_time' => '%s',
//							'end_time' => '%s',
							'times' => '',
							'description' => '%s',
							'category_title' => '%s',
							'formatted_hosts' => '%s',
					);
					foreach( $show_keys as $key => $format ) {
						if( isset( $programme[$key] ) ) {
							$value = $programme[$key];
							if( is_array( $value ) ) {
								$value = implode( ',', $value );
							}
						} else {
							$format = '%s';
							// TODO: Get directly from Kompassi?
							if( 'times' == $key ) {
								$start_date = date_i18n( 'j.n.Y', strtotime( $programme['start_time'] ) );
								$end_date = date_i18n( 'j.n.Y', strtotime( $programme['end_time'] ) );

								$value = date_i18n( 'D j.n. H.i', strtotime( $programme['start_time'] ) );
								$value .= ' – ';
								if( $start_date == $end_date ) {
									$value .= date_i18n( 'H.i', strtotime( $programme['end_time'] ) );
								} else {
									$value .= date_i18n( 'D j.n. H.i', strtotime( $programme['end_time'] ) );
								}
							}
						}
						if( isset( $value ) ) {
							echo '<div class="' . $key . '" style="grid-area: ' . $key . ';">' . sprintf( $format, $value ) . '</div>';
						}
					}
					echo '<div class="img" style="grid-area: img;"></div>';
				?>
			</article>
		<?php
		return ob_get_clean( );
	}

	/**
	 *  Sorts programme by event starting time
	 *  Callable function for usort()
	 */

	function sort_by_starting_time( $a, $b ) {
		if( $a['start_time'] > $b['start_time'] ) {
			return 1;
		} elseif( $b['start_time'] > $a['start_time'] ) {
			return -1;
		} else {
			return 0;
		}
	}
}

new WP_Plugin_Kompassi_Integration( );
