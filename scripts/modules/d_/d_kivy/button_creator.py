""" Custom button """
import kivy.uix.button
Button = kivy.uix.button.Button

import settings
globals().update({k: v for k, v in settings.__dict__.items() if not k.startswith('__')})
import scripts.modules.textures as textures
globals().update({k: v for k, v in textures.__dict__.items() if not k.startswith('__')})

def create_basic_button(window, button_ref, bg_normal='', bg_down='', text='Basic', color=RED, 
						font_name='AdventureRequest', size=(100,100), pos_hint={'x':0,'y':0}, callback=None):
	if button_ref:
		window.remove_widget(button_ref)
						
	button = None
	if bg_normal == '' or bg_down == '':
		button = Button(text=text, font_name=font_name, color=color, size_hint=(size[0]/scr_width(), size[1]/scr_height()), pos_hint=pos_hint)
	else:
		button = Button(background_normal=bg_normal, background_down=bg_down, text=text, font_name=font_name, color=color, size_hint=(size[0]/scr_width(), size[1]/scr_height()), pos_hint=pos_hint)			
	
	try:						
		button.bind(state=callback)
		
	except Exception as a:
		print('{a} Invalid callback function!')
	
	window.add_widget(button)
	
	return button
	
def create_font_button(window, button_ref, text='Basic', font = 'AdventureRequest', font_size='50sp', color=RED, 
						font_name='AdventureRequest', size=(100.0,100.0), pos_hint={'x':0,'y':0}, callback=None):

	dimensions = size[0]/scr_width(), size[1]/scr_height()
	
	if button_ref:
		window.remove_widget(button_ref)
							
	button = None
	if font == '' or font_size == '':
		button = Button(text=text, color=color, size_hint=dimensions, pos_hint=pos_hint)
	else:
		button = Button(background_color = (0,0,0,0), font_name=font, font_size=font_size, text=text, 
						color=color, size_hint=dimensions, pos_hint=pos_hint)
	
	try:						
		button.bind(state=callback)
		
	except Exception as a:
		raise Exception('Invalid callback function!')
	
	window.add_widget(button)
	
	return button
				
					
					