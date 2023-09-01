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
		add_action( 'wp_enqueue_scripts', array( &$this, 'wp_enqueue_scripts' ) );
		add_action( 'enqueue_block_editor_assets', array( &$this, 'enqueue_block_editor_assets' ) );
		add_filter( 'block_categories_all', array( &$this, 'block_categories_all' ), 10, 2 );

		$this->programmes_to_show = 9999;
	}

	function init( ) {
		load_plugin_textdomain( 'kompassi-integration', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

		register_block_type(
			'kompassi-integration/program-map',
			array(
				'editor_script' => 'kompassi-integration-blocks',
				'render_callback' => array( &$this, 'block_program_map' ),
				'attributes' => array(
				)
			)
		);
		register_block_type(
			'kompassi-integration/programme',
			array(
				'editor_script' => 'kompassi-integration-blocks',
				'render_callback' => array( &$this, 'block_programme' ),
				'attributes' => array(
				)
			)
		);
	}

	function wp_enqueue_scripts( ) {
		wp_enqueue_script( 'kompassi-integration-frontend', plugins_url( 'frontend.js', __FILE__ ), array( 'jquery' ) );
		wp_enqueue_script( 'kompassi-integration-frontend-new', plugins_url( 'frontend-new.js', __FILE__ ), array( 'jquery' ) );
		wp_enqueue_style( 'kompassi-integration-frontend', plugins_url( 'frontend.css', __FILE__ ) );
		wp_enqueue_style( 'kompassi-integration-frontend-new', plugins_url( 'frontend-new.css', __FILE__ ) );
	}

	function enqueue_block_editor_assets( ) {
		wp_register_script( 'kompassi-integration-blocks', plugins_url( 'blocks.js', __FILE__ ), array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-i18n' ) );
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

	function block_programme( $attributes ) {
		$class = '';
		if( isset( $attributes['align'] ) ) { $class .= 'align' . $attributes['align']; }
		$out = '<div ' . get_block_wrapper_attributes( array( 'class' => $class ) ) . '>';
		$prog = $this->get_data( );

		/*  Display styles  */
		$out .= '<section id="display-style">';
		$display_styles = array(
			'table' => _x( 'Table', 'display style', 'kompassi-integration' ),
			'list' => _x( 'Compact List', 'display style', 'kompassi-integration' ),
			'expanded' => _x( 'Expanded List', 'display style', 'kompassi-integration' ),
			'timeline' => _x( 'Timeline', 'display style', 'kompassi-integration' )
		);
		foreach( $display_styles as $slug => $label ) {
			$out .= '<a class="' . $slug . '">' . $label . '</a>';
		}
		$out .= '</section>';

		/*  Programme  */
		$out .= '<section class="programme-list timeline">';
		foreach( array_slice( $prog, 0, $this->programmes_to_show, true ) as $p ) {
			$out .= $this->markup_program( $p );
		}
		$out .= '</section>';

		$out .= '</div>';
		return $out;
	}

	function block_program_map( $attributes ) {
		$class = '';
		if( isset( $attributes['align'] ) ) { $class .= 'align' . $attributes['align']; }
		$out = '<div ' . get_block_wrapper_attributes( array( 'class' => $class ) ) . '>';
		ob_start( );
		require_once plugin_dir_path( __FILE__ ) . 'blocks/program_map.php';
		$out .= ob_get_clean( );
		$out .= '</div>';
		return $out;
	}

	function get_data( ) {
		// Get programme JSON and convert it into array
		$json = file_get_contents( plugin_dir_url( __FILE__ ) . 'data/2023.json' );
//		$json = str_replace( '\r\n', '<br />', $json ); // TODO: Why here?
		$programme = json_decode( $json, true );

		// Sort programme by event starting time
		// TODO: Is this required?
		usort( $programme, array( &$this, 'sort_by_starting_time' ) );

		return $programme;
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

	function markup_program( $programme ) {
		ob_start( );
		$attrs = array(
			'length' => $programme['length'],
			'start-timestamp' => strtotime( $programme['start_time'] ),
			'end-timestamp' => strtotime( $programme['end_time'] ),
			'room-name' => $programme['room_name']
		);
		$html_attrs = '';
		foreach( $attrs as $attr => $value ) {
			$html_attrs .= ' data-' . $attr . '="' . $value . '"';
		}
		?>
			<article class="program" id="<?php echo $programme['identifier']; ?>" <?php echo $html_attrs; ?>>
				<?php
					$show_keys = array(
							'title' => '<strong>%s</strong>',
							'room_name' => '%s',
							'start_time' => '%s',
							'end_time' => '%s',
							'description' => '%s',
							'category_title' => '%s',
							'formatted_hosts' => 'Hosts: %s',
					);
					foreach( $show_keys as $key => $format ) {
						if( isset( $programme[$key] ) ) {
							$value = $programme[$key];
							if( is_array( $value ) ) {
								$value = implode( ',', $value );
							}
							echo '<div class="entry ' . $key . '" style="grid-area: ' . $key . ';">' . sprintf( $format, $value ) . '</div>';
						}
					}
					echo '<div class="entry img" style="grid-area: img;"></div>';
					/*
					foreach( $programme as $key => $value ) {
						if( !in_array( $key, array_keys( $show_keys ) ) || empty( $value ) ) {
							continue;
						}
						if( is_array( $value ) ) {
							$value = implode( ', ', $value );
						}
						echo '<div class="entry ' . $key . '" style="grid-area: ' . $key . ';">' . sprintf( $show_keys[$key], $value ) . '</div>';
					}
					*/
				?>
			</article>
		<?php
		return ob_get_clean( );
	}
}

require_once 'init.php';

new WP_Plugin_Kompassi_Integration( );
