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
			'kompassi-integration/schedule',
			array(
				'editor_script' => 'kompassi-integration-blocks',
				'render_callback' => array( &$this, 'block_schedule' ),
				'attributes' => array(
					'default_display' => array( 'type' => 'string', 'default' => 'list' ),
					'show_filters' => array( 'type' => 'boolean', 'default' => true ),
					'show_display_styles' => array( 'type' => 'boolean', 'default' => true ),
					'show_favorites_only' => array( 'type' => 'boolean', 'default' => false )
				),
			)
		);
	}

	function admin_init( ) {
		add_settings_section( 'kompassi-integration-general', '', '', 'kompassi_integration_settings' );

		$fields = array(
			'feed_url' => array(
				'label' =>  __( 'Feed URL', 'kompassi-integration' ),
				'description' => __( 'Feed URL where program data is loaded from.', 'kompassi-integration' )
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
	 *  TODO: #9 - Caching?
	 *
	 */

	function get_data( ) {
		// Get program JSON and convert it into array
		// TODO: #10 - Only allow specific format, eg. only ask for the event slug?
		$json = file_get_contents( get_option( 'kompassi_integration_feed_url' ) );
		$program = json_decode( $json, true );
		foreach( $program['programs'] as $index => $prog ) {
			if( isset( $prog['start_time'] ) ) {
				$program['programs'][$index]['start_timestamp'] = strtotime( $prog['start_time'] );
			}
			if( isset( $prog['end_time'] ) ) {
				$program['programs'][$index]['end_timestamp'] = strtotime( $prog['end_time'] );
			}
		}

		return $program;
	}

	/*
	 *  Show the schedule block
	 *
	 */

	function block_schedule( $attributes ) {
		$html_attrs = array( 'class' => '' );
		if( isset( $attributes['align'] ) ) { $html_attrs['class'] .= ' align' . $attributes['align']; }
		if( $attributes['show_filters'] ) { $html_attrs['data-show-filters'] = 'true'; }
		if( $attributes['show_display_styles'] ) { $html_attrs['data-show-display-styles'] = 'true'; }
		if( $attributes['show_favorites_only'] ) { $html_attrs['data-show-favorites-only'] = 'true'; }

		$out = '<div id="kompassi_block_schedule" ' . get_block_wrapper_attributes( $html_attrs ) . '>';

		/*  Schedule  */
		$out .= '<section id="kompassi_schedule" class="' . $attributes['default_display'] . '">';
		$this->data = $this->get_data( );
		foreach( $this->data['programs'] as $p ) {
			$out .= $this->markup_program( $p, $this->data['dimensions'] );
		}
		$out .= '</section>';

		/*  TODO: For now, output dimensions JSON with a script tag right here... */
		$out .= '<script>kompassi_schedule_dimensions = ' . json_encode( $this->data['dimensions'] ) . '</script>';

		/*
		 *  Program colors
		 *  Color values from dimensions later in the data will override earlier values
		 *  Philosophically, more specific tags should take precendence
		 *  TODO: Possibility to order dimensions from Kompassi or implement in WP admin?
		 *
		 */
		$out .= '<style>';
		foreach( $this->data['dimensions'] as $dimension_slug => $dimension ) {
			foreach( $dimension['values'] as $value_slug => $value ) {
				if( isset( $value['color'] ) ) {
					$out .= '#kompassi_schedule article[data-' . $dimension_slug . '="' .  $value_slug . '"] { --kompassi-program-color: ' . $value['color'] . '; }';
				}
			}
		}
		$out .= '</style>';

		$out .= '</div>';
		return $out;
	}

	/*
	 *  Return markup for a single program event
	 *
	 */

	function markup_program( $program, $dimensions ) {
		ob_start( );
		$attrs = array(
			'id' => $program['identifier'],
			'length' => $program['length'],
			'start-timestamp' => $program['start_timestamp'], // strtotime( $program['start_time'] ),
			'end-timestamp' => $program['end_timestamp'], // strtotime( $program['end_time'] ),
		);
		foreach( $program['dimensions'] as $dimension => $values ) {
			if( count( $values ) > 0 ) {
				$attrs[$dimension] = $values[0];
			}
		}

		$html_attrs = '';
		foreach( $attrs as $attr => $value ) {
			$html_attrs .= ' data-' . $attr . '="' . $value . '"';
		}
		$program['description'] = nl2br( $program['description'] );
		?>
			<article id="<?php echo $program['identifier']; ?>" class="kompassi-program" <?php echo $html_attrs; ?>>
				<?php
					foreach( array( 'title', 'room_name', 'times', 'description', 'short_blurb', 'formatted_hosts' ) as $key ) {
						$value = '';
						if( isset( $program[$key] ) ) {
							$value = $program[$key];
							if( is_array( $value ) ) {
								$value = implode( ',', $value );
							}
						} else {
							// TODO: #11 - Get directly from Kompassi?
							if( 'times' == $key ) {
								$value = date_i18n( 'D j.n. k\l\o H.i', $program['start_timestamp'] + ( get_option( 'gmt_offset' ) * 60 * 60 ) );
								// If multiday, show both days
							}
						}
						if( isset( $value ) ) {
							echo '<div class="' . $key . '" style="grid-area: ' . $key . ';">' . $value . '</div>';
						}
					}
					// Traverse through dimensions
					foreach( $program['dimensions'] as $dimension => $data ) {
						echo '<div class="dimension ' . $dimension . '" style="grid-area: ' . $dimension . ';">';
						foreach( $data as $slug ) {
							if( $slug != 'ANY' && $slug != 'OTHER' ) {
								if( isset( $dimensions[$dimension]['values'][$slug]['display_name'] ) ) {
									echo '<span class="value">' . $dimensions[$dimension]['values'][$slug]['display_name'] . '</span> ';
								} else {
									echo '<span class="value">' . $slug . '</span> ';
								}
							}
						}
						echo '</div>';
					}
					//echo '<div class="visual" style="grid-area: visual;"></div>';
				?>
			</article>
		<?php
		return ob_get_clean( );
	}

	/**
	 *  Sorts program by event starting time
	 *  Callable function for usort()
	 */

	function sort_by_starting_time( $a, $b ) {
		if( $a['start_timestamp'] > $b['start_timestamp'] ) {
			return 1;
		} elseif( $b['start_timestamp'] > $a['start_timestamp'] ) {
			return -1;
		} else {
			return 0;
		}
	}
}

new WP_Plugin_Kompassi_Integration( );
