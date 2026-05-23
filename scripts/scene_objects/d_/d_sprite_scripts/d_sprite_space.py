""" sprite handler """
import random

#from kivy.uix.layout import Layout
import scripts.kivy_tools.base_layout
SpritesLayout = scripts.kivy_tools.base_layout.SpritesLayout
import scripts.scene_objects.sprite_scripts.sprite as sprite
globals().update({k: v for k, v in sprite.__dict__.items() if not k.startswith('__')})

import scripts.scene_objects.sprite_scripts
sprite_manager = scripts.scene_objects.sprite_scripts.sprite_manager

class SpriteSpace(SpritesLayout):
	def __init__(self, game, hide=False, **kwargs):	
		super().__init__(game, hide=hide, **kwargs)
		self.game.sprite_space = self
		
		self.c_t_s = None		
		self.FOV_s = []
		self.o_s = []
		self.load_list = []

		loader.init(self.load_list)						

		self.reload_sprites()


					
					
					
					
					
					
					
					
					
					
					
					
					
					
					
					
					
