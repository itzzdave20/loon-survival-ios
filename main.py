import kivy.app
import scripts.main_window

class MainApp(kivy.app.App):
	title = "Loon Survival"
	def build(self):
		root = scripts.main_window.MainWindow()
		root.bind(size=root.re_init,pos=root.re_init)
		return root

if __name__ == "__main__":
	MainApp().run()

__version__="1.0.3"
